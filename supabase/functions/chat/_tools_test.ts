import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  execCalculator,
  execReadTable,
  execWebSearch,
  chooseToolChoice,
  isToolModelFallbackError,
  runTool,
  TOOL_SCHEMAS,
} from "./_tools.ts";

// ---------- calculator ----------

Deno.test("calculator: simple arithmetic", () => {
  const out = JSON.parse(execCalculator({ expression: "2*(3+4)" }));
  assertEquals(out.result, 14);
});

Deno.test("calculator: realistic loan interest", () => {
  const out = JSON.parse(execCalculator({ expression: "1500000 * 0.0325 / 12" }));
  // 1500000 * 0.0325 / 12 = 4062.5
  assertEquals(out.result, 4062.5);
});

Deno.test("calculator: math functions allowed", () => {
  const out = JSON.parse(execCalculator({ expression: "sqrt(144) + round(3.6)" }));
  assertEquals(out.result, 16);
});

Deno.test("calculator: rejects disallowed identifier", () => {
  const out = JSON.parse(execCalculator({ expression: "fetch(1)" }));
  assert(out.error, "should error on disallowed identifier");
});

Deno.test("calculator: rejects bad characters", () => {
  const out = JSON.parse(execCalculator({ expression: "1; alert(1)" }));
  assert(out.error, "should error on bad chars");
});

Deno.test("calculator: rejects non-finite result", () => {
  const out = JSON.parse(execCalculator({ expression: "1/0" }));
  assert(out.error, "division by zero must error");
});

// ---------- chooseToolChoice heuristic ----------

Deno.test("chooseToolChoice: forces calculator on math query", () => {
  const choice = chooseToolChoice(
    [{ role: "user", content: "ช่วยคำนวณ 1500000 * 0.0325 / 12 ให้หน่อย" }],
    { calculator: true, webSearch: true },
    0,
  );
  assertEquals(typeof choice, "object");
  // @ts-ignore narrowed
  assertEquals(choice.function.name, "calculator");
});

Deno.test("chooseToolChoice: forces web_search on news query", () => {
  const choice = chooseToolChoice(
    [{ role: "user", content: "ขอข่าวล่าสุดเรื่อง AI agents วันนี้" }],
    { calculator: true, webSearch: true },
    0,
  );
  // @ts-ignore narrowed
  assertEquals(choice.function.name, "web_search");
});

Deno.test("chooseToolChoice: auto on neutral query", () => {
  const choice = chooseToolChoice(
    [{ role: "user", content: "เล่าเรื่องสุนัขให้ฟังหน่อย" }],
    { calculator: true, webSearch: true },
    0,
  );
  assertEquals(choice, "auto");
});

Deno.test("chooseToolChoice: never forces after iteration 0", () => {
  const choice = chooseToolChoice(
    [{ role: "user", content: "คำนวณ 2+2" }],
    { calculator: true, webSearch: true },
    1,
  );
  assertEquals(choice, "auto");
});

Deno.test("chooseToolChoice: respects disabled tool", () => {
  const choice = chooseToolChoice(
    [{ role: "user", content: "คำนวณ 2+2" }],
    { calculator: false, webSearch: true },
    0,
  );
  assertEquals(choice, "auto");
});

// ---------- model fallback predicate ----------

Deno.test("isToolModelFallbackError: 400/404/422 fall back", () => {
  assert(isToolModelFallbackError(400, "bad model"));
  assert(isToolModelFallbackError(404, "model not found"));
  assert(isToolModelFallbackError(422, "unsupported tools"));
});

Deno.test("isToolModelFallbackError: 429/402 do not fall back", () => {
  assertEquals(isToolModelFallbackError(429, ""), false);
  assertEquals(isToolModelFallbackError(402, ""), false);
});

// ---------- read_knowledge_table with mocked supabase ----------

function mockSupabase(rows: any[]) {
  return {
    from(_table: string) {
      const builder: any = {
        _filters: {},
        select() { return builder; },
        eq(_k: string, _v: any) { return builder; },
        async then(resolve: any) { resolve({ data: rows, error: null }); },
      };
      // Make the chain awaitable (last .eq() returns promise-like)
      builder.eq = (_k: string, _v: any) => builder;
      // Provide thenable terminal
      builder[Symbol.asyncIterator] = undefined;
      return builder;
    },
  };
}

Deno.test("read_knowledge_table: returns preview of csv file", async () => {
  const csv = "name,age\nAlice,30\nBob,25\nCarol,40";
  const supabase = mockSupabase([
    { file_name: "people.csv", content: csv, file_type: "text/csv" },
  ]);
  const out = JSON.parse(
    await execReadTable({ max_rows: 10 }, { supabase, agentId: "agent-1", userId: "user-1" }),
  );
  assertEquals(out.file_name, "people.csv");
  assertStringIncludes(out.preview, "Alice,30");
  assertStringIncludes(out.preview, "Carol,40");
});

Deno.test("read_knowledge_table: error when no agent context", async () => {
  const supabase = mockSupabase([]);
  const out = JSON.parse(
    await execReadTable({}, { supabase, agentId: "", userId: "user-1" }),
  );
  assertEquals(out.error, "no agent context");
});

Deno.test("read_knowledge_table: error when no files", async () => {
  const supabase = mockSupabase([]);
  const out = JSON.parse(
    await execReadTable({}, { supabase, agentId: "a", userId: "u" }),
  );
  assertEquals(out.error, "no knowledge files");
});

// ---------- runTool dispatch ----------

Deno.test("runTool: dispatches calculator", async () => {
  const out = JSON.parse(await runTool("calculator", JSON.stringify({ expression: "10/4" }), {}));
  assertEquals(out.result, 2.5);
});

Deno.test("runTool: unknown tool returns error", async () => {
  const out = JSON.parse(await runTool("bogus_tool", "{}", {}));
  assertStringIncludes(out.error, "unknown tool");
});

// ---------- TOOL_SCHEMAS surface ----------

Deno.test("TOOL_SCHEMAS: all three tools present with required fields", () => {
  for (const key of ["web-search", "calculator", "read-excel"]) {
    const t = TOOL_SCHEMAS[key];
    assert(t, `missing schema for ${key}`);
    assertEquals(t.type, "function");
    assert(t.function?.name, `missing function.name on ${key}`);
    assert(t.function?.parameters, `missing parameters on ${key}`);
  }
});

// ---------- Live web_search (integration) ----------
// Uses real TAVILY_API_KEY if present in .env. Skipped otherwise.

Deno.test({
  name: "execWebSearch: live Tavily call returns results",
  ignore: !Deno.env.get("TAVILY_API_KEY"),
  async fn() {
    const out = JSON.parse(await execWebSearch({ query: "OpenAI GPT latest news", max_results: 2 }));
    assert(!out.error, `unexpected error: ${out.error}`);
    assert(Array.isArray(out.results), "results must be an array");
    assert(out.results.length >= 1, "should return at least one result");
    assert(out.results[0].url, "result must have url");
  },
});
