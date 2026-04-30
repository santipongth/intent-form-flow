// Pure tool implementations + helpers, exported for unit tests.
// Keep this file framework-free so Deno test runner can import without serving.

export const TOOL_SCHEMAS: Record<string, any> = {
  "web-search": {
    type: "function",
    function: {
      name: "web_search",
      description:
        "ค้นหาข้อมูลล่าสุดจากอินเทอร์เน็ต ใช้เมื่อต้องการข้อมูลปัจจุบัน ข่าว ข้อเท็จจริงที่อาจไม่ได้อยู่ในความรู้ของโมเดล",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำค้นเป็นภาษาธรรมชาติ" },
          max_results: { type: "number", description: "จำนวนผลลัพธ์ (1-5)", default: 3 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  calculator: {
    type: "function",
    function: {
      name: "calculator",
      description:
        "คำนวณนิพจน์คณิตศาสตร์อย่างปลอดภัย รองรับ +,-,*,/,(),%,**,sqrt,sin,cos,tan,log,ln,abs,min,max,round",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "นิพจน์เช่น '2*(3+4)' หรือ 'sqrt(144)+5'" },
        },
        required: ["expression"],
        additionalProperties: false,
      },
    },
  },
  "read-excel": {
    type: "function",
    function: {
      name: "read_knowledge_table",
      description:
        "อ่านและสรุปข้อมูลจากไฟล์ Excel/CSV ที่ผู้ใช้อัปโหลดไว้ใน knowledge base ของ agent นี้",
      parameters: {
        type: "object",
        properties: {
          file_name: {
            type: "string",
            description: "ชื่อไฟล์ที่ต้องการอ่าน (ถ้าไม่ระบุจะใช้ไฟล์ Excel/CSV ตัวแรก)",
          },
          max_rows: { type: "number", description: "จำนวนแถวสูงสุดที่จะคืน (default 50)", default: 50 },
        },
        additionalProperties: false,
      },
    },
  },
};

// ---------- Implementations ----------

export async function execWebSearch(args: any): Promise<string> {
  const TAVILY = Deno.env.get("TAVILY_API_KEY");
  if (!TAVILY) {
    return JSON.stringify({ error: "Web search not configured (missing TAVILY_API_KEY)" });
  }
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY,
        query: String(args.query || "").slice(0, 400),
        max_results: Math.min(Math.max(Number(args.max_results) || 3, 1), 5),
        search_depth: "basic",
        include_answer: true,
      }),
    });
    if (!r.ok) return JSON.stringify({ error: `web search failed: ${r.status}` });
    const data = await r.json();
    return JSON.stringify({
      answer: data.answer || null,
      results: (data.results || []).map((x: any) => ({
        title: x.title,
        url: x.url,
        content: (x.content || "").slice(0, 600),
      })),
    });
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

export function execCalculator(args: any): string {
  const expr = String(args.expression || "");
  const allowed = /^[\s0-9+\-*/().,%]+$|^[A-Za-z0-9_+\-*/().,%\s]+$/;
  if (!allowed.test(expr)) return JSON.stringify({ error: "invalid characters" });
  const allowedNames = [
    "sqrt", "sin", "cos", "tan", "log", "ln", "abs", "min", "max", "round", "pow", "PI", "E",
  ];
  const idents = expr.match(/[A-Za-z_]+/g) || [];
  for (const id of idents) {
    if (!allowedNames.includes(id)) {
      return JSON.stringify({ error: `disallowed identifier: ${id}` });
    }
  }
  try {
    const ctx = {
      sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
      log: Math.log10, ln: Math.log, abs: Math.abs, min: Math.min, max: Math.max,
      round: Math.round, pow: Math.pow, PI: Math.PI, E: Math.E,
    };
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(ctx), `"use strict"; return (${expr});`);
    const result = fn(...Object.values(ctx));
    if (typeof result !== "number" || !isFinite(result)) {
      return JSON.stringify({ error: "non-numeric result" });
    }
    return JSON.stringify({ result });
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

export async function execReadTable(
  args: any,
  ctx: { supabase: any; agentId: string; userId: string },
): Promise<string> {
  if (!ctx.agentId) return JSON.stringify({ error: "no agent context" });
  const { data: files } = await ctx.supabase
    .from("knowledge_files")
    .select("file_name, content, file_type")
    .eq("agent_id", ctx.agentId)
    .eq("user_id", ctx.userId)
    .eq("status", "ready");
  if (!files || files.length === 0) return JSON.stringify({ error: "no knowledge files" });

  const tabular = files.filter((f: any) =>
    /(csv|excel|spreadsheet|sheet)/i.test(f.file_type || "") ||
    /\.(csv|xlsx|xls)$/i.test(f.file_name || "")
  );
  const pool = tabular.length > 0 ? tabular : files;
  const target = args.file_name
    ? pool.find((f: any) =>
      f.file_name?.toLowerCase().includes(String(args.file_name).toLowerCase())
    )
    : pool[0];
  if (!target) {
    return JSON.stringify({
      error: "file not found",
      available: pool.map((f: any) => f.file_name),
    });
  }

  const max = Math.min(Math.max(Number(args.max_rows) || 50, 1), 200);
  const content = (target.content || "").split("\n").slice(0, max + 1).join("\n");
  return JSON.stringify({
    file_name: target.file_name,
    preview: content,
    truncated: (target.content || "").length > content.length,
  });
}

export async function runTool(name: string, argsJson: string, ctx: any): Promise<string> {
  let args: any = {};
  try { args = JSON.parse(argsJson || "{}"); } catch { /* keep empty */ }
  if (name === "web_search") return execWebSearch(args);
  if (name === "calculator") return execCalculator(args);
  if (name === "read_knowledge_table") return execReadTable(args, ctx);
  return JSON.stringify({ error: `unknown tool: ${name}` });
}

// ---------- Heuristic: force tool choice when the query clearly needs it ----------

const MATH_HINT =
  /(\bcalc(ulate)?\b|\bคำนวณ\b|\bผลรวม\b|\bเท่ากับเท่าไร\b|\bกี่บาท\b|\d[\d.,\s]*[+\-*\/×÷%][\d.,\s]*\d|\bsqrt\b|\bsin\b|\bcos\b|\btan\b|\^|\*\*)/i;
const NEWS_HINT =
  /(\bข่าว\b|\bล่าสุด\b|\bวันนี้\b|\bเมื่อวาน\b|\bnews\b|\blatest\b|\btoday\b|\byesterday\b|\bcurrent\b|\bปัจจุบัน\b|\bราคา\b.*\b(หุ้น|ทอง|น้ำมัน|bitcoin|btc|eth)\b|\bweather\b|\bอากาศ\b)/i;

/**
 * Inspect the latest user message and decide whether to force a specific tool.
 * Returns OpenAI-compatible `tool_choice` value. Falls back to "auto".
 * Only forces on iteration 0 — later iterations need "auto" so the model can
 * read tool results and produce a final answer.
 */
export function chooseToolChoice(
  messages: { role: string; content: string }[],
  enabled: { calculator?: boolean; webSearch?: boolean },
  iteration: number,
): "auto" | { type: "function"; function: { name: string } } {
  if (iteration > 0) return "auto";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = String(lastUser?.content || "");
  if (!text) return "auto";

  const isMath = MATH_HINT.test(text);
  const isNews = NEWS_HINT.test(text);

  if (isMath && enabled.calculator) {
    return { type: "function", function: { name: "calculator" } };
  }
  if (isNews && enabled.webSearch) {
    return { type: "function", function: { name: "web_search" } };
  }
  return "auto";
}

// ---------- Model selection with automatic fallback ----------

/**
 * Models that reliably emit OpenAI-style `tool_calls` through the Lovable AI
 * gateway. Order = preference. Used only by the tool-probe loop; the final
 * streaming answer still uses the agent-configured model.
 */
export const TOOL_MODEL_CHAIN = [
  "openai/gpt-5-mini",
  "openai/gpt-5",
  "google/gemini-2.5-pro",
] as const;

/**
 * Treat these gateway responses as "this model can't do tools right now,
 * fall back to the next one in the chain".
 */
export function isToolModelFallbackError(status: number, body: string): boolean {
  if (status === 400 || status === 404 || status === 422 || status === 501) return true;
  if (status >= 500 && status !== 502) {
    return /tool|function|model|unsupported|mapping|not\s*found/i.test(body);
  }
  return false;
}
