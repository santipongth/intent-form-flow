// Shared embedding + semantic knowledge retrieval helpers.
// Used by `embed-knowledge` (indexing) and by chat/agent-api (retrieval).

export const EMBEDDING_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const EMBEDDINGS_URL = "https://ai.gateway.lovable.dev/v1/embeddings";

export async function embedTexts(texts: string[], apiKey: string): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await fetch(EMBEDDINGS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`embeddings failed ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const data = json.data || [];
  return data
    .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
    .map((d: any) => d.embedding as number[]);
}

/** Split a document into overlapping chunks on paragraph/line boundaries. */
export function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = (text || "").replace(/\r/g, "").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const br = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(". "));
      if (br > size * 0.5) end = start + br + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

/**
 * Retrieve the passages most relevant to the user's question.
 * Falls back to `null` when the agent has no indexed chunks yet, so callers
 * can keep their previous whole-file behaviour.
 */
export interface KnowledgePassage {
  file_name: string;
  content: string;
  similarity: number;
}

export interface RetrievalResult {
  passages: KnowledgePassage[] | null;
  /** ms spent embedding the question */
  embedMs: number;
  /** ms spent on the vector search itself */
  searchMs: number;
  /** embed + search */
  totalMs: number;
}

/**
 * Detailed retrieval with per-stage timings so the Monitor page can show how
 * long the document search took versus the answer.
 * Single round-trip: the previous "does this agent have chunks?" count query
 * was dropped — an empty match result means the same thing.
 */
export async function retrieveKnowledgeDetailed(
  supabase: any,
  agentId: string,
  question: string,
  apiKey: string,
  matchCount = 6,
): Promise<RetrievalResult> {
  const empty: RetrievalResult = { passages: null, embedMs: 0, searchMs: 0, totalMs: 0 };
  if (!agentId || !question.trim()) return empty;

  const t0 = Date.now();
  try {
    const [vec] = await embedTexts([question.slice(0, 2000)], apiKey);
    const t1 = Date.now();
    if (!vec) return { ...empty, embedMs: t1 - t0, totalMs: t1 - t0 };
    const { data, error } = await supabase.rpc("match_knowledge_chunks", {
      _agent_id: agentId,
      _query_embedding: JSON.stringify(vec),
      _match_count: matchCount,
    });
    const t2 = Date.now();
    if (error) {
      console.error("[rag] match failed", error.message);
      return { passages: null, embedMs: t1 - t0, searchMs: t2 - t1, totalMs: t2 - t0 };
    }
    const rows = (data || []) as KnowledgePassage[];
    return {
      passages: rows.length > 0 ? rows : null,
      embedMs: t1 - t0,
      searchMs: t2 - t1,
      totalMs: t2 - t0,
    };
  } catch (e) {
    console.error("[rag] retrieval failed", (e as Error).message);
    const t = Date.now() - t0;
    return { passages: null, embedMs: t, searchMs: 0, totalMs: t };
  }
}

export async function retrieveKnowledge(
  supabase: any,
  agentId: string,
  question: string,
  apiKey: string,
  matchCount = 6,
): Promise<KnowledgePassage[] | null> {
  const r = await retrieveKnowledgeDetailed(supabase, agentId, question, apiKey, matchCount);
  return r.passages;
}

/** Render retrieved passages as a system-prompt section. */
export function renderKnowledgeContext(
  passages: { file_name: string; content: string; similarity: number }[],
): string {
  if (passages.length === 0) return "";
  let out = "\n\n---\nRelevant excerpts from the agent's knowledge base (most relevant first):\n";
  for (const p of passages) {
    out += `[${p.file_name}]\n${p.content}\n\n`;
  }
  out += "---\nUse these excerpts as the primary source of truth. If they do not cover the question, say so.";
  return out;
}
