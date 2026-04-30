import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  TOOL_SCHEMAS,
  runTool,
  chooseToolChoice,
  TOOL_MODEL_CHAIN,
  isToolModelFallbackError,
} from "./_tools.ts";

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

    // Agent config
    let systemPrompt = "You are a helpful AI assistant. Keep answers clear and concise.";
    let model = "google/gemini-2.5-flash";
    let temperature = 0.7;
    let memoryEnabled = true;
    let toolsEnabled: Record<string, boolean> = {};

    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("system_prompt, model, temperature, name, objective, memory_enabled, tools")
        .eq("id", agent_id).eq("user_id", userId).single();
      if (agent) {
        if (agent.system_prompt) systemPrompt = agent.system_prompt;
        else if (agent.objective) systemPrompt = `You are ${agent.name}. Your objective: ${agent.objective}. Be helpful and respond naturally.`;
        if (agent.temperature != null) temperature = agent.temperature;
        if (agent.memory_enabled === false) memoryEnabled = false;
        if (agent.tools && typeof agent.tools === "object") toolsEnabled = agent.tools as any;
      }

      // Knowledge base injection
      const { data: knowledgeFiles } = await supabase
        .from("knowledge_files").select("file_name, content")
        .eq("agent_id", agent_id).eq("user_id", userId).eq("status", "ready");
      if (knowledgeFiles && knowledgeFiles.length > 0) {
        let knowledgeContext = "\n\n---\nReference Documents:\n";
        let total = 0; const MAX = 50000;
        for (const kf of knowledgeFiles) {
          if (!kf.content) continue;
          const chunk = kf.content.substring(0, MAX - total);
          knowledgeContext += `[Document: ${kf.file_name}]\n${chunk}\n\n`;
          total += chunk.length; if (total >= MAX) break;
        }
        knowledgeContext += "---\nUse the above documents as reference to answer questions accurately.";
        systemPrompt += knowledgeContext;
      }
    }

    // Build active tool schemas
    const activeTools: any[] = [];
    for (const key of ["web-search", "calculator", "read-excel"]) {
      if (toolsEnabled[key]) activeTools.push(TOOL_SCHEMAS[key]);
    }

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

    // ---------- Tool-calling loop (non-streaming for tool steps, stream final answer) ----------
    let toolIterations = 0;
    const MAX_TOOL_ITERATIONS = 4;
    // Track which tool model is currently working. We try models in order and
    // remember the working one so subsequent iterations don't re-fall-back.
    let toolModelIdx = 0;

    while (toolIterations < MAX_TOOL_ITERATIONS && activeTools.length > 0) {
      const toolChoice = chooseToolChoice(
        baseMessages,
        { calculator: !!toolsEnabled["calculator"], webSearch: !!toolsEnabled["web-search"] },
        toolIterations,
      );

      // Try tool models in chain until one succeeds (handles gateway model
      // mapping issues that occasionally return 4xx for unsupported tools).
      let probeRes: Response | null = null;
      let probeErrBody = "";
      while (toolModelIdx < TOOL_MODEL_CHAIN.length) {
        const candidate = TOOL_MODEL_CHAIN[toolModelIdx];
        const r = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: candidate,
            messages: baseMessages,
            temperature,
            tools: activeTools,
            tool_choice: toolChoice,
            stream: false,
          }),
        });
        if (r.ok) {
          probeRes = r;
          if (toolModelIdx > 0) {
            console.log("[chat] tool model fallback in use:", candidate);
          }
          break;
        }
        if (r.status === 429 || r.status === 402) {
          const msg = r.status === 429
            ? "Rate limit exceeded. Please try again later."
            : "Payment required. Please add credits to your workspace.";
          return new Response(JSON.stringify({ error: msg }), {
            status: r.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        probeErrBody = await r.text();
        const shouldFallback = isToolModelFallbackError(r.status, probeErrBody);
        console.error(
          "[chat] tool probe failed",
          { model: candidate, status: r.status, fallback: shouldFallback, body: probeErrBody.slice(0, 300) },
        );
        if (!shouldFallback) {
          return new Response(JSON.stringify({ error: "AI gateway error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        toolModelIdx++;
      }
      if (!probeRes) {
        console.error("[chat] all tool models exhausted", probeErrBody.slice(0, 300));
        return new Response(JSON.stringify({ error: "No tool-capable model available" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const probe = await probeRes.json();
      const choice = probe.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;
      console.log(
        "[chat] tool probe iter", toolIterations,
        "model:", TOOL_MODEL_CHAIN[toolModelIdx],
        "tool_choice:", typeof toolChoice === "string" ? toolChoice : `forced:${toolChoice.function.name}`,
        "finish:", choice?.finish_reason,
        "tool_calls:", toolCalls?.length || 0,
      );
      if (!toolCalls || toolCalls.length === 0) {
        // No tool needed → break and stream final answer in next phase
        break;
      }
      // Append assistant tool-call message
      baseMessages.push({
        role: "assistant",
        content: choice.message.content || "",
        tool_calls: toolCalls,
      });
      // Execute each tool
      for (const tc of toolCalls) {
        const result = await runTool(tc.function?.name, tc.function?.arguments, {
          supabase, agentId: agent_id, userId,
        });
        baseMessages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
      toolIterations++;
    }

    // ---------- Final streaming response ----------
    const response = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, messages: baseMessages, temperature, stream: true,
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
    const transformStream = new TransformStream({
      transform(chunk, controller) {
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
