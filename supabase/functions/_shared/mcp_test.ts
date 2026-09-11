import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { summariseToolResult } from "./mcp-client.ts";
import { mcpFunctionName, mcpToolSchema, chainExecutors } from "./mcp-tools.ts";

Deno.test("summarises text content", () => {
  assertEquals(
    summariseToolResult({ content: [{ type: "text", text: "hello" }, { type: "text", text: "world" }] }),
    "hello\nworld",
  );
});

Deno.test("marks error results", () => {
  const out = summariseToolResult({ isError: true, content: [{ type: "text", text: "boom" }] });
  assertStringIncludes(out, "ERROR: boom");
});

Deno.test("prefers structured content", () => {
  assertEquals(summariseToolResult({ structuredContent: { a: 1 } }), '{"a":1}');
});

Deno.test("namespaces tool names safely", () => {
  const name = mcpFunctionName("โน้ตชั่น notion", "search-pages");
  assertStringIncludes(name, "mcp_");
  assertEquals(/^[a-zA-Z0-9_-]+$/.test(name), true);
});

Deno.test("normalises a missing input schema", () => {
  const schema = mcpToolSchema("mcp_x_y", { name: "y" }, "x");
  assertEquals(schema.function.parameters.type, "object");
  assertEquals(schema.function.parameters.required, []);
});

Deno.test("chained executors fall through", async () => {
  const exec = chainExecutors(
    async () => null,
    async (name) => (name === "b" ? "hit" : null),
  );
  assertEquals(await exec("a", "{}"), null);
  assertEquals(await exec("b", "{}"), "hit");
});
