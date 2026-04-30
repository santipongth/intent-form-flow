// Send a sample payload to a webhook for testing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { webhook_id, event } = await req.json();
    if (!webhook_id) {
      return new Response(JSON.stringify({ error: "webhook_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hook } = await supabase
      .from("agent_webhooks")
      .select("id, agent_id, url, secret, events")
      .eq("id", webhook_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!hook) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const testEvent = event || hook.events?.[0] || "chat.completed";
    const payload = JSON.stringify({
      event: testEvent,
      agent_id: hook.agent_id,
      data: {
        test: true,
        messages: [{ role: "user", content: "This is a test event from ThoughtMind" }],
        reply: "Hello! This is a sample assistant response.",
        tokens_used: 42,
        response_time_ms: 350,
      },
      timestamp: new Date().toISOString(),
    });

    const sigBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload + hook.secret));
    const sig = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    let status = "error";
    let statusCode = 0;
    let bodyText = "";
    try {
      const r = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tm-signature": sig,
          "x-tm-event": testEvent,
          "x-tm-test": "true",
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
      statusCode = r.status;
      bodyText = (await r.text()).substring(0, 200);
      status = r.ok ? `${r.status} OK` : `${r.status}`;
    } catch (e) {
      status = `error: ${(e as Error).message}`;
    }

    await supabase.from("agent_webhooks").update({
      last_triggered_at: new Date().toISOString(),
      last_status: `[test] ${status}`,
    }).eq("id", hook.id);

    return new Response(JSON.stringify({
      ok: statusCode >= 200 && statusCode < 300,
      status_code: statusCode,
      status,
      body_preview: bodyText,
      sent_payload: JSON.parse(payload),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});