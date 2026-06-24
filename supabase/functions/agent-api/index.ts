// Public Agent API endpoint - authenticate via x-api-key header
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After",
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logError(supabase: any, payload: Record<string, unknown>) {
  try {
    await supabase.from("error_logs").insert(payload);
  } catch (_) { /* ignore */ }
}

async function dispatchWebhooks(supabase: any, agentId: string, event: string, data: Record<string, unknown>) {
  try {
    const { data: hooks } = await supabase
      .from("agent_webhooks")
      .select("id, url, secret, events")
      .eq("agent_id", agentId)
      .eq("enabled", true);

    if (!hooks || hooks.length === 0) return;

    const body = JSON.stringify({ event, agent_id: agentId, data, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      hooks
        .filter((h: any) => (h.events || []).includes(event))
        .map(async (h: any) => {
          try {
            const sigBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body + h.secret));
            const sig = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
            const resp = await fetch(h.url, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-tm-signature": sig, "x-tm-event": event },
              body,
            });
            await supabase.from("agent_webhooks").update({
              last_triggered_at: new Date().toISOString(),
              last_status: `${resp.status}`,
            }).eq("id", h.id);
          } catch (e) {
            await supabase.from("agent_webhooks").update({
              last_triggered_at: new Date().toISOString(),
              last_status: `error: ${(e as Error).message}`,
            }).eq("id", h.id);
          }
        })
    );
  } catch (_) { /* ignore */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyHash = await sha256(apiKey);
    const { data: keyRow } = await supabase
      .from("agent_api_keys")
      .select("id, agent_id, user_id, revoked_at")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (!keyRow || keyRow.revoked_at) {
      return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabase.from("agent_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});

    // Rate limit: 60 req/min per API key (atomic counter via RPC)
    const RATE_LIMIT = 60;
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();
    const { data: usageCount, error: rlErr } = await supabase.rpc("increment_api_key_usage", {
      _api_key_id: keyRow.id,
      _user_id: keyRow.user_id,
      _window: windowStart,
    });
    if (!rlErr && typeof usageCount === "number" && usageCount > RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", limit: RATE_LIMIT, window: "60s" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    // Validate body size & shape
    const rawText = await req.text();
    if (rawText.length > 256_000) {
      return new Response(JSON.stringify({ error: "Request body too large (max 256KB)" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let body: any = null;
    try { body = rawText ? JSON.parse(rawText) : null; } catch { body = null; }
    const message = body?.message;
    const messages = body?.messages;
    const sessionId: string | undefined = typeof body?.session_id === "string" && body.session_id.trim().length > 0
      ? body.session_id.trim().slice(0, 128)
      : undefined;
    const wantStream = body?.stream === true;
    const wantReset = body?.reset === true || body?.action === "reset";

    // ---------- Session reset endpoint ----------
    // POST { "session_id": "...", "reset": true }  -> deletes conversation + chat history
    // Optionally combined with `message` to start fresh in the same call.
    if (wantReset) {
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "reset requires a session_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", keyRow.user_id)
        .eq("agent_id", keyRow.agent_id)
        .eq("external_session_id", sessionId)
        .maybeSingle();
      let deleted = false;
      if (existing) {
        await supabase.from("chat_messages").delete().eq("conversation_id", existing.id);
        await supabase.from("conversations").delete().eq("id", existing.id);
        deleted = true;
      }
      if (!message && !messages) {
        return new Response(JSON.stringify({ ok: true, session_id: sessionId, deleted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // fall through: continue with a fresh session if message provided
    }

    if (!message && !messages) {
      return new Response(JSON.stringify({ error: "Provide 'message' (string) or 'messages' (array)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages !== undefined && (!Array.isArray(messages) || messages.length === 0 || messages.length > 100)) {
      return new Response(JSON.stringify({ error: "messages must be an array of 1-100 items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message !== undefined && (typeof message !== "string" || message.length === 0 || message.length > 32_000)) {
      return new Response(JSON.stringify({ error: "message must be a non-empty string up to 32000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalMessages = messages && Array.isArray(messages)
      ? messages
      : [{ role: "user", content: String(message) }];

    const { data: agent } = await supabase
      .from("agents")
      .select("name, objective, system_prompt, model, temperature, status")
      .eq("id", keyRow.agent_id)
      .eq("user_id", keyRow.user_id)
      .maybeSingle();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (agent.status !== "published") {
      return new Response(JSON.stringify({ error: "Agent is not published. Toggle Publish in the agent's Deploy tab." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = agent.system_prompt
      || (agent.objective ? `You are ${agent.name}. Objective: ${agent.objective}.` : "You are a helpful assistant.");

    const { data: knowledge } = await supabase
      .from("knowledge_files")
      .select("file_name, content")
      .eq("agent_id", keyRow.agent_id)
      .eq("status", "ready");

    if (knowledge && knowledge.length > 0) {
      let ctx = "\n\n---\nReference Documents:\n";
      let total = 0;
      const MAX = 50000;
      for (const k of knowledge) {
        if (!k.content) continue;
        const chunk = k.content.substring(0, MAX - total);
        ctx += `[${k.file_name}]\n${chunk}\n\n`;
        total += chunk.length;
        if (total >= MAX) break;
      }
      systemPrompt += ctx + "---";
    }

    // ---------- Optional session memory ----------
    let conversationId: string | null = null;
    let historyMessages: Array<{ role: string; content: string }> = [];
    if (sessionId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", keyRow.user_id)
        .eq("agent_id", keyRow.agent_id)
        .eq("external_session_id", sessionId)
        .maybeSingle();
      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("conversations")
          .insert({
            user_id: keyRow.user_id,
            agent_id: keyRow.agent_id,
            external_session_id: sessionId,
            title: `API session ${sessionId.substring(0, 24)}`,
          })
          .select("id")
          .single();
        conversationId = created?.id ?? null;
      }
      if (conversationId) {
        const { data: rows } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(40);
        historyMessages = (rows || []).map((r: any) => ({ role: r.role, content: r.content }));
      }
    }

    const persistMessages = async (userMsg: string, assistantMsg: string, tokens: number | null, respMs: number) => {
      if (!conversationId) return;
      try {
        await supabase.from("chat_messages").insert([
          { conversation_id: conversationId, role: "user", content: userMsg },
          { conversation_id: conversationId, role: "assistant", content: assistantMsg, tokens_used: tokens ?? 0, response_time_ms: respMs },
        ]);
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      } catch (_) { /* ignore */ }
    };

    // Last user message text for persistence (works whether they sent `message` or `messages`)
    const lastUserText = (() => {
      for (let i = finalMessages.length - 1; i >= 0; i--) {
        const m: any = finalMessages[i];
        if (m?.role === "user" && typeof m?.content === "string") return m.content;
      }
      return typeof message === "string" ? message : "";
    })();

    const gatewayMessages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      ...finalMessages,
    ];

    const startTime = Date.now();

    // ---------- Streaming branch ----------
    if (wantStream) {
      const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: agent.model || "google/gemini-2.5-flash",
          messages: gatewayMessages,
          temperature: agent.temperature ?? 0.7,
          stream: true,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text().catch(() => "");
        const status = upstream.status === 429 ? 429 : upstream.status === 402 ? 402 : 502;
        return new Response(JSON.stringify({ error: "AI provider error", status: upstream.status, detail: errText.substring(0, 300) }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let assembled = "";
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              controller.enqueue(encoder.encode(chunk));
              let idx;
              while ((idx = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, idx).replace(/\r$/, "");
                buffer = buffer.slice(idx + 1);
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") continue;
                try {
                  const j = JSON.parse(payload);
                  const delta = j.choices?.[0]?.delta?.content;
                  if (delta) assembled += delta;
                } catch { /* ignore */ }
              }
            }
          } catch (e) {
            controller.error(e);
            return;
          }
          controller.close();

          const respMs = Date.now() - startTime;
          try {
            await supabase.from("agent_analytics_events").insert({
              agent_id: keyRow.agent_id,
              user_id: keyRow.user_id,
              event_type: "api_chat_stream",
              status: "success",
              response_time_ms: respMs,
              tokens_used: null,
            });
          } catch (_) { /* ignore */ }
          await persistMessages(lastUserText, assembled, null, respMs);
          dispatchWebhooks(supabase, keyRow.agent_id, "chat.completed", {
            messages: finalMessages,
            reply: assembled,
            tokens_used: null,
            response_time_ms: respMs,
            session_id: sessionId ?? null,
            stream: true,
          });
        },
        cancel() { try { reader.cancel(); } catch (_) { /* ignore */ } },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Session-Id": sessionId ?? "",
        },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-2.5-flash",
        messages: gatewayMessages,
        temperature: agent.temperature ?? 0.7,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      await logError(supabase, {
        user_id: keyRow.user_id,
        agent_id: keyRow.agent_id,
        source: "agent-api",
        level: "error",
        message: `AI gateway ${aiResp.status}`,
        context: { body: errText.substring(0, 500) },
      });
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 502;
      return new Response(JSON.stringify({ error: "AI provider error", status: aiResp.status }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResp.json();
    const reply = result.choices?.[0]?.message?.content || "";
    const tokens = result.usage?.total_tokens ?? null;
    const responseTime = Date.now() - startTime;

    await supabase.from("agent_analytics_events").insert({
      agent_id: keyRow.agent_id,
      user_id: keyRow.user_id,
      event_type: "api_chat",
      status: "success",
      response_time_ms: responseTime,
      tokens_used: tokens,
    });

    await persistMessages(lastUserText, reply, tokens, responseTime);

    dispatchWebhooks(supabase, keyRow.agent_id, "chat.completed", {
      messages: finalMessages,
      reply,
      tokens_used: tokens,
      response_time_ms: responseTime,
      session_id: sessionId ?? null,
    });

    return new Response(JSON.stringify({
      reply,
      tokens_used: tokens,
      response_time_ms: responseTime,
      model: agent.model,
      session_id: sessionId ?? null,
      conversation_id: conversationId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-api error:", e);
    // We don't always have keyRow here; best-effort log without user_id
    await logError(supabase, {
      source: "agent-api",
      level: "error",
      message: (e as Error).message,
      context: { phase: "top-level" },
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});