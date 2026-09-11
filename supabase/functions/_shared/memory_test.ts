import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { loadHistory, MAX_REPLAY_MESSAGES } from "./memory.ts";

/** Minimal supabase stub covering the query chain loadHistory uses. */
function stub(summaryCount: number, total: number) {
  const rows = Array.from({ length: total }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `m${i}`,
    created_at: new Date(1700000000000 + i * 1000).toISOString(),
  }));
  return {
    from(table: string) {
      if (table === "conversations") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { memory_summary: "sum", summary_message_count: summaryCount } }) }) }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: (_c: string, o: { ascending: boolean }) => ({
              limit: async (n: number) => {
                const desc = rows.slice().reverse();
                return { data: (o.ascending ? rows : desc).slice(0, n) };
              },
            }),
          }),
        }),
      };
    },
  };
}

Deno.test("keeps the LATEST messages, not the oldest", async () => {
  const total = 120;
  const { rows, summary } = await loadHistory(stub(0, total), "c1");
  assertEquals(summary, "sum");
  assertEquals(rows.length, MAX_REPLAY_MESSAGES);
  assertEquals(rows[rows.length - 1].content, `m${total - 1}`);
  assertEquals(rows[0].content, `m${total - MAX_REPLAY_MESSAGES}`);
});

Deno.test("skips the already-summarised prefix", async () => {
  const { rows } = await loadHistory(stub(100, 110), "c1");
  assertEquals(rows.length, 10);
  assertEquals(rows[0].content, "m100");
});
