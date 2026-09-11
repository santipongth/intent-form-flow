// Owner-only endpoint: try a custom tool once and return the raw result,
// so users can verify their API binding before enabling it for the agent.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { executeCustomTool, validateToolUrl, type CustomToolRow } from "../_shared/custom-tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const toolId: string | undefined = body?.tool_id;
    const args: Record<string, unknown> = body?.arguments && typeof body.arguments === "object" ? body.arguments : {};
    if (!toolId) return json({ error: "tool_id is required" }, 400);

    const { data: row } = await supabase
      .from("agent_custom_tools")
      .select("id, name, description, method, url, parameters, auth_type, auth_header_name, auth_secret, enabled, user_id")
      .eq("id", toolId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row) return json({ error: "Tool not found" }, 404);

    const urlError = validateToolUrl(row.url);
    if (urlError) return json({ ok: false, error: urlError }, 400);

    const result = await executeCustomTool(row as CustomToolRow, args);

    await supabase.from("agent_custom_tools").update({
      last_tested_at: new Date().toISOString(),
      last_test_status: result.ok ? `ok ${result.status}` : `error: ${result.error || result.status}`,
    }).eq("id", row.id);

    // Never echo credentials back to the client.
    return json({
      ok: result.ok,
      status: result.status ?? null,
      duration_ms: result.duration_ms,
      error: result.error ?? null,
      body: (result.body || "").slice(0, 4000),
    });
  } catch (e) {
    console.error("test-custom-tool error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
