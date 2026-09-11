// Authenticated helper for MCP server management: test a connection and
// sync the server's tool list into the agent's configuration.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { McpSession, MAX_MCP_TOOLS } from "../_shared/mcp-client.ts";
import { validateToolUrl } from "../_shared/custom-tools.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "sync" ? "sync" : "test";
    const serverId: string | undefined = body?.server_id;

    let url: string = body?.url ?? "";
    let auth = {
      auth_type: (body?.auth_type ?? "none") as "none" | "bearer" | "header",
      auth_header_name: body?.auth_header_name ?? null,
      auth_secret: body?.auth_secret ?? null,
    };

    // For a saved server, always use the stored (owner-scoped) configuration.
    let row: any = null;
    if (serverId) {
      const { data } = await supabase
        .from("agent_mcp_servers")
        .select("id, user_id, url, auth_type, auth_header_name, auth_secret")
        .eq("id", serverId)
        .maybeSingle();
      if (!data || data.user_id !== user.id) return json({ error: "Not found" }, 404);
      row = data;
      url = data.url;
      if (!auth.auth_secret) {
        auth = {
          auth_type: data.auth_type,
          auth_header_name: data.auth_header_name,
          auth_secret: data.auth_secret,
        };
      }
    }

    const urlError = validateToolUrl(url);
    if (urlError) return json({ error: urlError }, 400);

    const session = new McpSession(url, auth);
    try {
      const info = await session.initialize();
      const tools = (await session.listTools()).slice(0, MAX_MCP_TOOLS);

      if (action === "sync" && row) {
        await supabase
          .from("agent_mcp_servers")
          .update({
            cached_tools: tools,
            last_synced_at: new Date().toISOString(),
            last_status: "connected",
            last_error: null,
          })
          .eq("id", row.id);
      }
      return json({ ok: true, server: info, tools });
    } catch (e) {
      const message = (e as Error).message;
      if (row) {
        await supabase
          .from("agent_mcp_servers")
          .update({ last_status: "error", last_error: message, last_synced_at: new Date().toISOString() })
          .eq("id", row.id);
      }
      return json({ ok: false, error: message }, 200);
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
