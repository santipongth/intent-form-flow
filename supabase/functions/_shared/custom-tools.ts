// User-defined tools: bind an external HTTPS API as an agent capability.
// Kept framework-free so the Deno test runner can import it directly.

export interface CustomToolParam {
  name: string;
  type: "string" | "number" | "boolean";
  description?: string;
  required?: boolean;
  location?: "query" | "body"; // default: query for GET/DELETE, body otherwise
}

export interface CustomToolRow {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  parameters: CustomToolParam[] | null;
  auth_type: "none" | "header" | "bearer";
  auth_header_name: string | null;
  auth_secret: string | null;
  enabled: boolean;
}

export const CUSTOM_TOOL_PREFIX = "ct_";
export const MAX_CUSTOM_TOOLS = 10;
const TIMEOUT_MS = 10_000;
const MAX_RESULT_BYTES = 8 * 1024;

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local incl. cloud metadata 169.254.169.254
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /\.internal$/i,
  /\.local$/i,
  /^metadata\./i,
];

/** Only public https endpoints may be called. Returns an error string when invalid. */
export function validateToolUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "invalid URL";
  }
  if (u.protocol !== "https:") return "only https:// URLs are allowed";
  const host = u.hostname;
  if (!host.includes(".") && !host.startsWith("[")) return "hostname must be a public domain";
  for (const p of BLOCKED_HOST_PATTERNS) {
    if (p.test(host)) return "internal/private network addresses are not allowed";
  }
  return null;
}

/** Convert a stored tool row into an OpenAI-compatible function schema. */
export function toolSchema(row: CustomToolRow) {
  const params = Array.isArray(row.parameters) ? row.parameters : [];
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const p of params) {
    if (!p?.name) continue;
    properties[p.name] = {
      type: p.type === "number" ? "number" : p.type === "boolean" ? "boolean" : "string",
      description: p.description || p.name,
    };
    if (p.required) required.push(p.name);
  }
  return {
    type: "function",
    function: {
      name: `${CUSTOM_TOOL_PREFIX}${row.name}`,
      description: row.description || `Call the ${row.name} API`,
      parameters: { type: "object", properties, required, additionalProperties: false },
    },
  };
}

export interface CustomToolCallResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
  duration_ms: number;
}

/** Execute one custom tool call against the user's API. Never throws. */
export async function executeCustomTool(
  row: CustomToolRow,
  args: Record<string, unknown>,
): Promise<CustomToolCallResult> {
  const started = Date.now();
  const urlError = validateToolUrl(row.url);
  if (urlError) return { ok: false, error: urlError, duration_ms: Date.now() - started };

  const method = (row.method || "GET").toUpperCase();
  const params = Array.isArray(row.parameters) ? row.parameters : [];
  const defaultLocation = method === "GET" || method === "DELETE" ? "query" : "body";

  const url = new URL(row.url);
  const bodyObj: Record<string, unknown> = {};
  for (const p of params) {
    if (!p?.name) continue;
    const value = args?.[p.name];
    if (value === undefined || value === null || value === "") continue;
    const where = p.location || defaultLocation;
    if (where === "query") url.searchParams.set(p.name, String(value));
    else bodyObj[p.name] = value;
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (row.auth_type === "bearer" && row.auth_secret) {
    headers["Authorization"] = `Bearer ${row.auth_secret}`;
  } else if (row.auth_type === "header" && row.auth_header_name && row.auth_secret) {
    headers[row.auth_header_name] = row.auth_secret;
  }
  const hasBody = method !== "GET" && method !== "DELETE";
  if (hasBody) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      redirect: "error",
      signal: controller.signal,
      ...(hasBody ? { body: JSON.stringify(bodyObj) } : {}),
    });
    const text = await res.text();
    const truncated = text.length > MAX_RESULT_BYTES;
    return {
      ok: res.ok,
      status: res.status,
      body: truncated ? text.slice(0, MAX_RESULT_BYTES) + "\n…(truncated)" : text,
      duration_ms: Date.now() - started,
    };
  } catch (e) {
    const msg = (e as Error).name === "AbortError"
      ? `timeout after ${TIMEOUT_MS}ms`
      : (e as Error).message;
    return { ok: false, error: msg, duration_ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

export interface CustomToolBundle {
  schemas: any[];
  /** function name (with prefix) -> row */
  byName: Record<string, CustomToolRow>;
}

/** Load an agent's enabled custom tools. Safe when the table is empty. */
export async function loadCustomTools(
  supabase: any,
  agentId: string | null,
): Promise<CustomToolBundle> {
  const empty: CustomToolBundle = { schemas: [], byName: {} };
  if (!agentId) return empty;
  try {
    const { data, error } = await supabase
      .from("agent_custom_tools")
      .select("id, name, description, method, url, parameters, auth_type, auth_header_name, auth_secret, enabled")
      .eq("agent_id", agentId)
      .eq("enabled", true)
      .limit(MAX_CUSTOM_TOOLS);
    if (error || !data) return empty;
    const bundle: CustomToolBundle = { schemas: [], byName: {} };
    for (const row of data as CustomToolRow[]) {
      if (validateToolUrl(row.url)) continue; // skip invalid endpoints
      bundle.schemas.push(toolSchema(row));
      bundle.byName[`${CUSTOM_TOOL_PREFIX}${row.name}`] = row;
    }
    return bundle;
  } catch (_) {
    return empty;
  }
}

/** Executor compatible with the shared tool loop. Returns null when not a custom tool. */
export function makeCustomToolExecutor(bundle: CustomToolBundle) {
  return async (name: string, argsJson: string): Promise<string | null> => {
    const row = bundle.byName[name];
    if (!row) return null;
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(argsJson || "{}"); } catch { /* keep empty */ }
    const result = await executeCustomTool(row, args);
    if (!result.ok) {
      return JSON.stringify({ error: result.error || `HTTP ${result.status}`, status: result.status ?? null });
    }
    return JSON.stringify({ status: result.status, data: result.body });
  };
}
