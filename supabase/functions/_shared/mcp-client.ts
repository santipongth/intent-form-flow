// Minimal MCP (Model Context Protocol) client over Streamable HTTP.
// Framework-free so the Deno test runner can import it directly.
//
// Flow: initialize -> notifications/initialized -> tools/list -> tools/call
// Servers may answer with plain JSON or an SSE stream; both are handled.

import { validateToolUrl } from "./custom-tools.ts";

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MAX_MCP_SERVERS = 5;
export const MAX_MCP_TOOLS = 30;
const TIMEOUT_MS = 15_000;
const MAX_RESULT_BYTES = 8 * 1024;

export interface McpAuth {
  auth_type: "none" | "bearer" | "header";
  auth_header_name?: string | null;
  auth_secret?: string | null;
}

export interface McpToolDef {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export class McpError extends Error {}

function authHeaders(auth: McpAuth): Record<string, string> {
  if (auth.auth_type === "bearer" && auth.auth_secret) {
    return { Authorization: `Bearer ${auth.auth_secret}` };
  }
  if (auth.auth_type === "header" && auth.auth_header_name && auth.auth_secret) {
    return { [auth.auth_header_name]: auth.auth_secret };
  }
  return {};
}

/** Extract the first JSON-RPC payload from a plain-JSON or SSE response body. */
function parsePayload(contentType: string, text: string): any {
  if (contentType.includes("text/event-stream")) {
    for (const block of text.split(/\n\n/)) {
      const dataLines = block
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim());
      if (dataLines.length === 0) continue;
      try {
        const obj = JSON.parse(dataLines.join("\n"));
        if (obj && (obj.result !== undefined || obj.error !== undefined)) return obj;
      } catch { /* keep scanning */ }
    }
    throw new McpError("server returned no JSON-RPC result in the event stream");
  }
  if (!text.trim()) throw new McpError("empty response from MCP server");
  return JSON.parse(text);
}

/**
 * One MCP session. Each call re-sends `initialize` only once; the session id
 * (when the server issues one) is carried on subsequent requests.
 */
export class McpSession {
  private sessionId: string | null = null;
  private initialized = false;
  private nextId = 1;

  constructor(private url: string, private auth: McpAuth) {}

  private async rpc(method: string, params?: unknown, notify = false): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const body: Record<string, unknown> = { jsonrpc: "2.0", method };
      if (params !== undefined) body.params = params;
      if (!notify) body.id = this.nextId++;

      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Required by the MCP Streamable HTTP spec; servers 406 without it.
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
          ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
          ...authHeaders(this.auth),
        },
        redirect: "error",
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      const sid = res.headers.get("Mcp-Session-Id");
      if (sid) this.sessionId = sid;

      if (notify) return null;

      const text = await res.text();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new McpError(`authentication failed (HTTP ${res.status}) — check the token`);
        }
        throw new McpError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const payload = parsePayload(res.headers.get("content-type") || "", text);
      if (payload?.error) {
        throw new McpError(payload.error.message || JSON.stringify(payload.error).slice(0, 300));
      }
      return payload?.result;
    } catch (e) {
      if (e instanceof McpError) throw e;
      if ((e as Error).name === "AbortError") throw new McpError(`timeout after ${TIMEOUT_MS}ms`);
      throw new McpError((e as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }

  async initialize(): Promise<{ serverName?: string; version?: string }> {
    if (this.initialized) return {};
    const urlError = validateToolUrl(this.url);
    if (urlError) throw new McpError(urlError);
    const result = await this.rpc("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "thoughtmind-agent", version: "1.0.0" },
    });
    this.initialized = true;
    try {
      await this.rpc("notifications/initialized", {}, true);
    } catch { /* optional for many servers */ }
    return {
      serverName: result?.serverInfo?.name,
      version: result?.serverInfo?.version,
    };
  }

  async listTools(): Promise<McpToolDef[]> {
    await this.initialize();
    const out: McpToolDef[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page++) {
      const result = await this.rpc("tools/list", cursor ? { cursor } : {});
      const tools = Array.isArray(result?.tools) ? result.tools : [];
      for (const t of tools) {
        if (!t?.name || typeof t.name !== "string") continue;
        out.push({
          name: t.name,
          description: typeof t.description === "string" ? t.description : "",
          inputSchema: t.inputSchema && typeof t.inputSchema === "object" ? t.inputSchema : undefined,
        });
        if (out.length >= MAX_MCP_TOOLS) return out;
      }
      cursor = typeof result?.nextCursor === "string" ? result.nextCursor : undefined;
      if (!cursor) break;
    }
    return out;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    await this.initialize();
    const result = await this.rpc("tools/call", { name, arguments: args ?? {} });
    return summariseToolResult(result);
  }
}

/** Flatten an MCP tool result into text the model can read. */
export function summariseToolResult(result: any): string {
  if (result == null) return "";
  if (result.structuredContent !== undefined) {
    return truncate(JSON.stringify(result.structuredContent));
  }
  const content = Array.isArray(result.content) ? result.content : [];
  const parts: string[] = [];
  for (const c of content) {
    if (!c || typeof c !== "object") continue;
    if (c.type === "text" && typeof c.text === "string") parts.push(c.text);
    else if (c.type === "resource" && c.resource?.text) parts.push(String(c.resource.text));
    else parts.push(`[${c.type ?? "content"}]`);
  }
  const text = parts.join("\n").trim() || truncate(JSON.stringify(result));
  const body = truncate(text);
  return result.isError ? `ERROR: ${body}` : body;
}

function truncate(s: string): string {
  return s.length > MAX_RESULT_BYTES ? s.slice(0, MAX_RESULT_BYTES) + "\n…(truncated)" : s;
}
