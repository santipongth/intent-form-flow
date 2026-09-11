import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { activeToolSchemas, runToolLoop } from "../_shared/tool-loop.ts";
import { retrieveKnowledgeDetailed, renderKnowledgeContext, buildCitations } from "../_shared/embeddings.ts";
import { TraceRecorder } from "../_shared/traces.ts";
import { normalizeModel, supportsCustomTemperature, maxTokensParams, DEFAULT_MODEL } from "../_shared/models.ts";
import { readAgentSettings, applyAgentSettings } from "../_shared/agent-settings.ts";
import { loadCustomTools, makeCustomToolExecutor } from "../_shared/custom-tools.ts";
import { loadGuardrails, checkInput, checkOutput, hardenSystemPrompt } from "../_shared/guardrails.ts";
import { checkBudget, recordUsage, BUDGET_EXCEEDED_MESSAGE } from "../_shared/budget.ts";

/** Emit a one-shot OpenAI-style SSE stream (used for blocked / filtered answers). */
function sseOnce(content: string, extra: Record<string, unknown> = {}) {
  const body =
    `data: ${JSON.stringify({ ...extra, choices: [{ delta: { content }, index: 0 }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop", index: 0 }] })}\n\n` +
    `data: [DONE]\n\n`;
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ---------- Memory: build history with rolling summary ----------
async function loadHistory(supabase: any, conversationId: string) {
  const { data: conv } = await supabase
    .from("conversations")
    .select("memory_summary, summary_message_count")
    .eq("id", conversationId)
    .maybeSingle();
  const { data: rows } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return { summary: conv?.memory_summary as string | null, summaryCount: conv?.summary_message_count || 0, rows: rows || [] };
}

async function maybeSummarize(
  supabase: any, conversationId: string, allRows: any[], existingSummary: string | null, existingCount: number, apiKey: string
) {
  const KEEP_RECENT = 12;
  const SUMMARIZE_THRESHOLD = 20;
  if (allRows.length < SUMMARIZE_THRESHOLD) return;
  const toSummarize = allRows.slice(existingCount, allRows.length - KEEP_RECENT);
  if (toSummarize.length < 6) return;

  const transcript = toSummarize.map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 12000);
  const prompt = `สรุปบทสนทนาต่อไปนี้เป็นภาษาเดียวกับบทสนทนา ให้สั้น กระชับ จับประเด็นสำคัญ ข้อเท็จจริง การตัดสินใจ และข้อมูลที่ผู้ใช้บอก (ชื่อ/ความชอบ/บริบทงาน) ที่ต้องจำสำหรับสนทนาต่อ — เขียนเป็นย่อหน้าเดียว ไม่เกิน 200 คำ\n\nสรุปก่อนหน้า (ถ้ามี): ${existingSummary || "(ไม่มี)"}\n\nบทสนทนาที่ต้องสรุปเพิ่ม:\n${transcript}`;

  try {
    const r = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
    if (!r.ok) return;
    const j = await r.json();
    const newSummary = j.choices?.[0]?.message?.content?.trim();
    if (newSummary) {
      await supabase
        .from("conversations")
        .update({ memory_summary: newSummary, summary_message_count: existingCount + toSummarize.length })
        .eq("id", conversationId);
    }
  } catch (_) { /* ignore */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, agent_id, conversation_id } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: "Too many messages (max 100)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let userId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) userId = user.id;

    let isPublicSession = false;
    if (!userId) {
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: pub } = await supabase
        .from("agents").select("user_id, status").eq("id", agent_id).eq("status", "published").maybeSingle();
      if (!pub) {
        return new Response(JSON.stringify({ error: "Agent not available" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = pub.user_id;
      isPublicSession = true;
    }

    const trace = new TraceRecorder(supabase, {
      agentId: agent_id ?? null,
      userId,
      conversationId: conversation_id ?? null,
      source: isPublicSession ? "widget" : "chat",
    });

    // Agent config
    let systemPrompt = "You are a helpful AI assistant. Keep answers clear and concise.";
    let model = DEFAULT_MODEL;
    let temperature = 0.7;
    let maxTokens: number | null = null;
    let memoryEnabled = true;
    let toolsEnabled: Record<string, boolean> = {};
    let citations: ReturnType<typeof buildCitations> = [];
    let settings = readAgentSettings(null);
    let hasKnowledge = false;

    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("system_prompt, model, temperature, max_tokens, name, objective, memory_enabled, tools")
        .eq("id", agent_id).eq("user_id", userId).single();
      if (agent) {
        if (agent.system_prompt) systemPrompt = agent.system_prompt;
        else if (agent.objective) systemPrompt = `You are ${agent.name}. Your objective: ${agent.objective}. Be helpful and respond naturally.`;
        model = normalizeModel(agent.model);
        if (agent.temperature != null) temperature = agent.temperature;
        if (agent.max_tokens != null) maxTokens = agent.max_tokens;
        if (agent.memory_enabled === false) memoryEnabled = false;
        if (agent.tools && typeof agent.tools === "object") toolsEnabled = agent.tools as any;
        settings = readAgentSettings(agent.tools);
      }


      // Knowledge: semantic retrieval first (RAG), whole-file context as fallback
      const lastUserQuestion = String(
        [...messages].reverse().find((m: any) => m.role === "user")?.content || "",
      );
      const ragStart = Date.now();
      const rag = await retrieveKnowledgeDetailed(supabase, agent_id, lastUserQuestion, LOVABLE_API_KEY);
      const passages = rag.passages;
      if (passages && passages.length > 0) {
        systemPrompt += renderKnowledgeContext(passages);
        citations = buildCitations(passages);
        hasKnowledge = true;

        trace.record({
          span_type: "retrieval",
          name: "semantic knowledge search",
          input: { question: lastUserQuestion.slice(0, 500) },
          output: {
            matches: passages.map((p) => ({ file: p.file_name, similarity: Number(p.similarity?.toFixed(3)) })),
            embed_ms: rag.embedMs,
            search_ms: rag.searchMs,
          },
          duration_ms: rag.totalMs,
        });
      } else {
        const { data: knowledgeFiles } = await supabase
          .from("knowledge_files").select("file_name, content")
          .eq("agent_id", agent_id).eq("user_id", userId).eq("status", "ready");
        if (knowledgeFiles && knowledgeFiles.length > 0) {
          let knowledgeContext = "\n\n---\nReference Documents:\n";
          let total = 0; const MAX = 20000;
          for (const kf of knowledgeFiles) {
            if (!kf.content) continue;
            const chunk = kf.content.substring(0, MAX - total);
            knowledgeContext += `[Document: ${kf.file_name}]\n${chunk}\n\n`;
            total += chunk.length; if (total >= MAX) break;
          }
          knowledgeContext += "---\nUse the above documents as reference to answer questions accurately.";
          systemPrompt += knowledgeContext;
          hasKnowledge = true;
          trace.record({
            span_type: "retrieval",
            name: "full document context (not indexed yet)",
            output: { files: knowledgeFiles.length },
            duration_ms: Date.now() - ragStart,
          });
        }
      }

      // Behaviour settings (user prompt, skills, answer scope) come last so the
      // strict-knowledge rule can reference the documents injected above.
      systemPrompt = applyAgentSettings(systemPrompt, settings, hasKnowledge);
    }


    // ---------- Budget: hard stop when the agent hit its cap ----------
    const budget = await checkBudget(supabase, agent_id ?? null);
    if (budget.blocked) {
      trace.record({ span_type: "error", name: "budget_exceeded", status: "error", output: { reason: budget.reason } });
      await trace.flush();
      return new Response(JSON.stringify({ error: BUDGET_EXCEEDED_MESSAGE, reason: budget.reason }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- Guardrails: filter the incoming message ----------
    const guardrails = await loadGuardrails(supabase, agent_id ?? null);
    const lastUserMessage = String([...messages].reverse().find((m: any) => m.role === "user")?.content || "");
    if (guardrails.enabled) {
      systemPrompt = hardenSystemPrompt(systemPrompt);
      const verdict = await checkInput(lastUserMessage, guardrails, LOVABLE_API_KEY);
      if (verdict.blocked) {
        trace.record({
          span_type: "guardrail", name: "input blocked", status: "error",
          input: { message: lastUserMessage.slice(0, 300) },
          output: { reason: verdict.reason, category: verdict.category },
        });
        await trace.flush();
        return sseOnce(guardrails.blocked_message, { tm_guardrail: { blocked: true, stage: "input" } });
      }
    }

    // Build active tool schemas (standard + the user's own API tools)
    const customTools = await loadCustomTools(supabase, agent_id ?? null);
    const activeTools = [...activeToolSchemas(toolsEnabled), ...customTools.schemas];
    const customExec = makeCustomToolExecutor(customTools);

    // Memory: load persisted history + summary, prepend to incoming messages
    let baseMessages: any[] = [{ role: "system", content: systemPrompt }];
    if (memoryEnabled && conversation_id && !isPublicSession) {
      const { summary, summaryCount, rows } = await loadHistory(supabase, conversation_id);
      if (summary) {
        baseMessages.push({ role: "system", content: `Previous conversation summary (older context):\n${summary}` });
      }
      // Append rows that are NOT already in the incoming messages.
      // The client typically sends only the latest user message; rows contain prior assistants too.
      const recent = rows.slice(summaryCount);
      // Avoid duplicating the very last user message if it equals the incoming last user message
      const incomingLastUser = [...messages].reverse().find((m: any) => m.role === "user");
      let cutoff = recent.length;
      if (incomingLastUser) {
        for (let i = recent.length - 1; i >= 0; i--) {
          if (recent[i].role === "user" && recent[i].content === incomingLastUser.content) { cutoff = i; break; }
        }
      }
      for (const r of recent.slice(0, cutoff)) {
        baseMessages.push({ role: r.role, content: r.content });
      }
    }
    baseMessages = baseMessages.concat(messages);

    const startTime = Date.now();

    // ---------- Tool-calling loop (shared with the public agent API) ----------
    const loop = await runToolLoop({
      messages: baseMessages,
      activeTools,
      toolsEnabled,
      apiKey: LOVABLE_API_KEY,
      temperature,
      supabase,
      agentId: agent_id ?? null,
      userId,
      trace,
      logPrefix: "[chat]",
      maxIterations: settings.maxToolIterations,
      extraExec: customExec,
    });
    baseMessages = loop.messages;
    const toolIterations = loop.iterations;
    if (loop.failure) {
      await trace.flush();
      return new Response(JSON.stringify({ error: loop.failure.error }), {
        status: loop.failure.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Output filtering needs the complete answer, so those agents answer in one shot.
    const needsOutputFilter = guardrails.enabled &&
      (guardrails.pii_redaction || guardrails.ai_review || (guardrails.blocked_keywords?.length ?? 0) > 0);

    if (needsOutputFilter) {
      const r = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model, messages: baseMessages, stream: false,
          ...(supportsCustomTemperature(model) ? { temperature } : {}),
          ...maxTokensParams(model, maxTokens),
          ...(activeTools.length > 0 ? { tools: activeTools, tool_choice: "none" } : {}),
        }),
      });
      if (!r.ok) {
        const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
        console.error("AI gateway final error:", r.status, (await r.text()).slice(0, 300));
        await trace.flush();
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const j = await r.json();
      const raw = j.choices?.[0]?.message?.content || "";
      const tokens = j.usage?.total_tokens || 0;
      const verdict = await checkOutput(raw, guardrails, LOVABLE_API_KEY);
      const responseTime = Date.now() - startTime;
      trace.record({
        span_type: "guardrail", name: "output filter",
        status: verdict.blocked ? "error" : "success",
        output: { blocked: verdict.blocked, reason: verdict.reason, redactions: verdict.redactions || 0 },
      });
      trace.record({
        span_type: "answer", name: model,
        output: { tokens_used: tokens || null, tool_iterations: toolIterations },
        duration_ms: responseTime,
      });
      await trace.flush();
      await recordUsage(supabase, agent_id ?? null, userId, tokens);
      if (agent_id && userId) {
        await supabase.from("agent_analytics_events").insert({
          agent_id, user_id: userId, event_type: "chat",
          status: verdict.blocked ? "error" : "success",
          response_time_ms: responseTime, tokens_used: tokens || null,
          metadata: { tool_iterations: toolIterations, guardrail_blocked: verdict.blocked },
        });
      }
      if (verdict.blocked) {
        return sseOnce(guardrails.blocked_message, { tm_guardrail: { blocked: true, stage: "output" } });
      }
      return sseOnce(verdict.text || raw, { tm_citations: citations, tm_budget_warning: budget.warning });
    }

    // ---------- Final streaming response ----------
    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, messages: baseMessages, stream: true,
        ...(supportsCustomTemperature(model) ? { temperature } : {}),
          ...maxTokensParams(model, maxTokens),
        ...(activeTools.length > 0 ? { tools: activeTools, tool_choice: "none" } : {}),
      }),
    });

    if (!response.ok) {
      const responseTime = Date.now() - startTime;
      if (agent_id && userId) {
        await supabase.from("agent_analytics_events").insert({
          agent_id, user_id: userId, event_type: "chat", status: "error",
          response_time_ms: responseTime, metadata: { error_status: response.status },
        });
      }
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway final error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let totalTokens = 0;
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let sentMeta = false;
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        if (!sentMeta) {
          sentMeta = true;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ tm_citations: citations, tm_budget_warning: budget.warning, choices: [{ delta: {}, index: 0 }] })}\n\n`,
          ));
        }
        controller.enqueue(chunk);
        const text = decoder.decode(chunk, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.usage?.total_tokens) totalTokens = parsed.usage.total_tokens;
            else if (parsed.usage?.prompt_tokens && parsed.usage?.completion_tokens) {
              totalTokens = parsed.usage.prompt_tokens + parsed.usage.completion_tokens;
            }
          } catch { /* ignore */ }
        }
      },
      async flush() {
        const responseTime = Date.now() - startTime;
        trace.record({
          span_type: "answer",
          name: model,
          output: { tokens_used: totalTokens || null, tool_iterations: toolIterations },
          duration_ms: responseTime,
        });
        trace.flush();
        recordUsage(supabase, agent_id ?? null, userId, totalTokens);
        if (agent_id && userId) {
          supabase.from("agent_analytics_events").insert({
            agent_id, user_id: userId, event_type: "chat", status: "success",
            response_time_ms: responseTime, tokens_used: totalTokens || null,
            metadata: { tool_iterations: toolIterations },
          }).then(() => {});

          // Webhook fan-out
          (async () => {
            try {
              const { data: hooks } = await supabase
                .from("agent_webhooks").select("id, url, secret, events")
                .eq("agent_id", agent_id).eq("enabled", true);
              if (!hooks || hooks.length === 0) return;
              const payload = JSON.stringify({
                event: "chat.completed", agent_id,
                data: { messages, tokens_used: totalTokens, response_time_ms: responseTime, tool_iterations: toolIterations },
                timestamp: new Date().toISOString(),
              });
              await Promise.allSettled(
                hooks.filter((h: any) => (h.events || []).includes("chat.completed")).map(async (h: any) => {
                  try {
                    const sigBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload + h.secret));
                    const sig = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
                    const r = await fetch(h.url, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-tm-signature": sig, "x-tm-event": "chat.completed" },
                      body: payload,
                    });
                    await supabase.from("agent_webhooks").update({
                      last_triggered_at: new Date().toISOString(), last_status: `${r.status}`,
                    }).eq("id", h.id);
                  } catch (e) {
                    await supabase.from("agent_webhooks").update({
                      last_triggered_at: new Date().toISOString(), last_status: `error: ${(e as Error).message}`,
                    }).eq("id", h.id);
                  }
                })
              );
            } catch (_) { /* ignore */ }
          })();

          // Rolling summary maintenance
          if (memoryEnabled && conversation_id && !isPublicSession) {
            (async () => {
              try {
                const { data: rows } = await supabase
                  .from("chat_messages").select("role, content, created_at")
                  .eq("conversation_id", conversation_id)
                  .order("created_at", { ascending: true });
                const { data: conv } = await supabase
                  .from("conversations").select("memory_summary, summary_message_count")
                  .eq("id", conversation_id).maybeSingle();
                await maybeSummarize(supabase, conversation_id, rows || [], conv?.memory_summary || null, conv?.summary_message_count || 0, LOVABLE_API_KEY);
              } catch (_) { /* ignore */ }
            })();
          }
        }
      },
    });

    return new Response(response.body!.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("error_logs").insert({
        source: "chat", level: "error", message: (e as Error).message || "unknown", context: {},
      });
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
