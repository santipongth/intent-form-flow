// Conversation memory shared by the in-app chat and the public agent API:
// recent turns from the database plus a rolling summary of older ones.

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const KEEP_RECENT = 12;
export const SUMMARIZE_THRESHOLD = 20;
/** Hard cap on how many stored turns are replayed verbatim. */
export const MAX_REPLAY_MESSAGES = 40;

export interface HistoryState {
  summary: string | null;
  summaryCount: number;
  rows: Array<{ role: string; content: string }>;
}

/**
 * Load a conversation's memory. Returns the rolling summary plus the messages
 * that come AFTER the summarised prefix, capped to the most recent
 * `MAX_REPLAY_MESSAGES` so long sessions never lose the latest context.
 */
export async function loadHistory(supabase: any, conversationId: string): Promise<HistoryState> {
  const { data: conv } = await supabase
    .from("conversations")
    .select("memory_summary, summary_message_count")
    .eq("id", conversationId)
    .maybeSingle();

  const summaryCount = conv?.summary_message_count || 0;

  // Newest-first with a limit, then reversed: keeps the LATEST turns, not the oldest.
  const { data: rows } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_REPLAY_MESSAGES + summaryCount);

  const ordered = (rows || []).slice().reverse();
  const afterSummary = ordered.slice(summaryCount);
  const recent = afterSummary.slice(-MAX_REPLAY_MESSAGES);

  return {
    summary: (conv?.memory_summary as string | null) ?? null,
    summaryCount,
    rows: recent.map((r: any) => ({ role: r.role, content: r.content })),
  };
}

/** Total stored message count for a conversation (used by the memory UI). */
export async function countMessages(supabase: any, conversationId: string): Promise<number> {
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);
  return count ?? 0;
}

/**
 * Fold older turns into the rolling summary once the conversation grows.
 * `allRows` must be the full ordered transcript. Never throws.
 */
export async function maybeSummarize(
  supabase: any,
  conversationId: string,
  allRows: Array<{ role: string; content: string }>,
  existingSummary: string | null,
  existingCount: number,
  apiKey: string,
): Promise<void> {
  if (allRows.length < SUMMARIZE_THRESHOLD) return;
  const toSummarize = allRows.slice(existingCount, allRows.length - KEEP_RECENT);
  if (toSummarize.length < 6) return;

  const transcript = toSummarize.map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 12000);
  const prompt =
    `สรุปบทสนทนาต่อไปนี้เป็นภาษาเดียวกับบทสนทนา ให้สั้น กระชับ จับประเด็นสำคัญ ข้อเท็จจริง การตัดสินใจ และข้อมูลที่ผู้ใช้บอก (ชื่อ/ความชอบ/บริบทงาน) ที่ต้องจำสำหรับสนทนาต่อ — เขียนเป็นย่อหน้าเดียว ไม่เกิน 200 คำ\n\n` +
    `สรุปก่อนหน้า (ถ้ามี): ${existingSummary || "(ไม่มี)"}\n\nบทสนทนาที่ต้องสรุปเพิ่ม:\n${transcript}`;

  try {
    const r = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
    if (!r.ok) return;
    const j = await r.json();
    const newSummary = j.choices?.[0]?.message?.content?.trim();
    if (newSummary) {
      await supabase
        .from("conversations")
        .update({
          memory_summary: newSummary,
          summary_message_count: existingCount + toSummarize.length,
        })
        .eq("id", conversationId);
    }
  } catch (_) { /* memory is best-effort; never break the answer */ }
}

/** Full ordered transcript, used after a turn to decide on summarisation. */
export async function loadAllRows(
  supabase: any,
  conversationId: string,
): Promise<Array<{ role: string; content: string }>> {
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data || []) as Array<{ role: string; content: string }>;
}
