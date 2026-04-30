/**
 * Helpers for reading the per-agent `tools` jsonb column safely.
 *
 * The column historically stores a flat map of tool toggles like
 * `{ "web-search": true }`, but we also embed two custom fields:
 *   - `_userPrompt` (string) — user prompt template
 *   - `_skills` (string[])   — list of skill tags
 *
 * Anything in here may be `null`, missing, or wrong-typed (e.g. an
 * older row, a hand-edited row, a Supabase realtime payload). Callers
 * should NEVER assume shape — go through these helpers.
 */
export type AgentTools = Record<string, unknown> | null | undefined;

/** Returns the `_userPrompt` string, defaulting to "" for any non-string. */
export function getUserPrompt(tools: AgentTools): string {
  if (!tools || typeof tools !== "object") return "";
  const v = (tools as Record<string, unknown>)._userPrompt;
  return typeof v === "string" ? v : "";
}

/**
 * Returns the `_skills` array of strings.
 * - Filters out non-strings.
 * - Trims whitespace, drops empties.
 * - De-duplicates case-insensitively, keeping first occurrence.
 */
export function getSkills(tools: AgentTools): string[] {
  if (!tools || typeof tools !== "object") return [];
  const v = (tools as Record<string, unknown>)._skills;
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Merge `_userPrompt` / `_skills` back into the existing tools object
 * without dropping unrelated tool toggles.
 */
export function withPromptAndSkills(
  tools: AgentTools,
  userPrompt: string,
  skills: string[],
): Record<string, unknown> {
  const base = tools && typeof tools === "object" ? { ...(tools as Record<string, unknown>) } : {};
  base._userPrompt = userPrompt;
  base._skills = skills;
  return base;
}
