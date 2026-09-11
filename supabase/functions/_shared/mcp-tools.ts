// Bridges an agent's configured MCP servers into the shared tool loop.

import { McpSession, MAX_MCP_SERVERS, MAX_MCP_TOOLS, type McpToolDef } from "./mcp-client.ts";

export const MCP_TOOL_PREFIX = "mcp_";

export interface McpServerRow {
  id: string;
  name: string;
  url: string;
  auth_type: "none" | "bearer" | "header";
  auth_header_name: string | null;
  auth_secret: string | null;
  enabled: boolean;
  allowed_tools: string[] | null;
  cached_tools: McpToolDef[] | null;
}

export interface McpBundle {
  schemas: any[];
  /** function name -> { session, toolName } */
  byName: Record<string, { session: McpSession; toolName: string; server: string }>;
}

/** Model-safe function name: mcp_<server>_<tool>, ASCII only. */
export function mcpFunctionName(serverName: string, toolName: string): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24);
  return `${MCP_TOOL_PREFIX}${clean(serverName)}_${clean(toolName)}`.slice(0, 64);
}

/** MCP inputSchema is already JSON Schema; normalise it for the gateway. */
export function mcpToolSchema(fnName: string, tool: McpToolDef, serverName: string) {
  const schema = tool.inputSchema && typeof tool.inputSchema === "object"
    ? { ...(tool.inputSchema as Record<string, unknown>) }
    : {};
  if (schema.type !== "object") schema.type = "object";
  if (!schema.properties || typeof schema.properties !== "object") schema.properties = {};
  if (!Array.isArray(schema.required)) schema.required = [];
  return {
    type: "function",
    function: {
      name: fnName,
      description: (tool.description || `MCP tool ${tool.name}`) + ` (via ${serverName})`,
      parameters: schema,
    },
  };
}

/**
 * Load the agent's enabled MCP servers and expose their allowed tools.
 * Uses the cached tool list (synced from the UI) so chat turns stay fast —
 * no `tools/list` round-trip per message.
 */
export async function loadMcpTools(supabase: any, agentId: string | null): Promise<McpBundle> {
  const empty: McpBundle = { schemas: [], byName: {} };
  if (!agentId) return empty;
  try {
    const { data, error } = await supabase
      .from("agent_mcp_servers")
      .select("id, name, url, auth_type, auth_header_name, auth_secret, enabled, allowed_tools, cached_tools")
      .eq("agent_id", agentId)
      .eq("enabled", true)
      .limit(MAX_MCP_SERVERS);
    if (error || !data) return empty;

    const bundle: McpBundle = { schemas: [], byName: {} };
    for (const row of data as McpServerRow[]) {
      const tools = Array.isArray(row.cached_tools) ? row.cached_tools : [];
      if (tools.length === 0) continue;
      const allow = Array.isArray(row.allowed_tools) ? row.allowed_tools : [];
      const session = new McpSession(row.url, {
        auth_type: row.auth_type,
        auth_header_name: row.auth_header_name,
        auth_secret: row.auth_secret,
      });
      for (const tool of tools) {
        if (!tool?.name) continue;
        if (allow.length > 0 && !allow.includes(tool.name)) continue;
        const fnName = mcpFunctionName(row.name, tool.name);
        if (bundle.byName[fnName]) continue;
        bundle.schemas.push(mcpToolSchema(fnName, tool, row.name));
        bundle.byName[fnName] = { session, toolName: tool.name, server: row.name };
        if (bundle.schemas.length >= MAX_MCP_TOOLS) return bundle;
      }
    }
    return bundle;
  } catch (_) {
    return empty;
  }
}

/** Executor compatible with the shared tool loop. Returns null when not an MCP tool. */
export function makeMcpExecutor(bundle: McpBundle) {
  return async (name: string, argsJson: string): Promise<string | null> => {
    const hit = bundle.byName[name];
    if (!hit) return null;
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(argsJson || "{}"); } catch { /* keep empty */ }
    try {
      return await hit.session.callTool(hit.toolName, args);
    } catch (e) {
      return JSON.stringify({ error: `MCP ${hit.server}: ${(e as Error).message}` });
    }
  };
}

/** Chain several executors (custom API tools + MCP tools) into one. */
export function chainExecutors(
  ...execs: Array<((name: string, argsJson: string) => Promise<string | null>) | undefined>
) {
  return async (name: string, argsJson: string): Promise<string | null> => {
    for (const exec of execs) {
      if (!exec) continue;
      const out = await exec(name, argsJson);
      if (out !== null) return out;
    }
    return null;
  };
}
