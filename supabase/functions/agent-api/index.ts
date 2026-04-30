// Public Agent API endpoint - authenticate via x-api-key header
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const body = await req.json().catch(() => null);
    const message = body?.message;
    const messages = body?.messages;
    if (!message && !messages) {
      return new Response(JSON.stringify({ error: "Provide 'message' (string) or 'messages' (array)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalMessages = messages && Array.isArray(messages)
      ? messages
      : [{ role: "user", content: String(message) }];

    const { data: agent } = await supabase
      .from("agents")
      .select("name, objective, system_prompt, model, temperature")
      .eq("id", keyRow.agent_id)
      .eq("user_id", keyRow.user_id)
      .maybeSingle();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const startTime = Date.now();
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
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

    dispatchWebhooks(supabase, keyRow.agent_id, "chat.completed", {
      messages: finalMessages,
      reply,
      tokens_used: tokens,
      response_time_ms: responseTime,
    });

    return new Response(JSON.stringify({
      reply,
      tokens_used: tokens,
      response_time_ms: responseTime,
      model: agent.model,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-api error:", e);
    await logError(supabase, {
      source: "agent-api",
      level: "error",
      message: (e as Error).message,
      context: {},
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});