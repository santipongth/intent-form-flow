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

export interface SkillEntry {
  name: string;
  instructions: string;
}

/**
 * Reads `_skills`, accepting both the legacy `string[]` shape and the newer
 * `{ name, instructions }[]` snapshot. De-duplicates case-insensitively.
 */
export function getSkillEntries(tools: AgentTools): SkillEntry[] {
  if (!tools || typeof tools !== "object") return [];
  const v = (tools as Record<string, unknown>)._skills;
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: SkillEntry[] = [];
  for (const item of v) {
    let name = "";
    let instructions = "";
    if (typeof item === "string") {
      name = item.trim();
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      name = typeof o.name === "string" ? o.name.trim() : "";
      instructions = typeof o.instructions === "string" ? o.instructions.trim() : "";
    }
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, instructions });
  }
  return out;
}

/** Returns just the skill names (UI selection state stays name-based). */
export function getSkills(tools: AgentTools): string[] {
  return getSkillEntries(tools).map((s) => s.name);
}

/**
 * Merge `_userPrompt` / `_skills` back into the existing tools object
 * without dropping unrelated tool toggles.
 * Accepts plain names or full `{ name, instructions }` snapshots.
 */
export function withPromptAndSkills(
  tools: AgentTools,
  userPrompt: string,
  skills: (string | SkillEntry)[],
): Record<string, unknown> {
  const base = tools && typeof tools === "object" ? { ...(tools as Record<string, unknown>) } : {};
  base._userPrompt = userPrompt;
  base._skills = skills.map((s) =>
    typeof s === "string" ? { name: s.trim(), instructions: "" } : { name: s.name.trim(), instructions: s.instructions ?? "" },
  );
  return base;
}

/* ------------------------------------------------------------------ *
 * Extra behaviour settings, also stored inside the `tools` jsonb blob.
 * Underscore-prefixed keys are configuration, never tool toggles.
 * ------------------------------------------------------------------ */

export interface AgentSettings {
  greeting: string;
  starters: string[];
  fallbackMessage: string;
  strictKnowledge: boolean;
  maxToolIterations: number;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  greeting: "",
  starters: [],
  fallbackMessage: "",
  strictKnowledge: false,
  maxToolIterations: 4,
};

function readStrArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, max);
}

export function getAgentSettings(tools: AgentTools): AgentSettings {
  if (!tools || typeof tools !== "object") return { ...DEFAULT_AGENT_SETTINGS };
  const t = tools as Record<string, unknown>;
  const iter = Number(t._maxToolIterations);
  return {
    greeting: typeof t._greeting === "string" ? t._greeting : "",
    starters: readStrArray(t._starters, 3),
    fallbackMessage: typeof t._fallbackMessage === "string" ? t._fallbackMessage : "",
    strictKnowledge: t._strictKnowledge === true,
    maxToolIterations: Number.isFinite(iter) ? Math.min(Math.max(Math.round(iter), 1), 8) : 4,
  };
}

/** Merge behaviour settings back without dropping tool toggles or prompt/skills. */
export function withAgentSettings(
  tools: AgentTools,
  settings: Partial<AgentSettings>,
): Record<string, unknown> {
  const base = tools && typeof tools === "object" ? { ...(tools as Record<string, unknown>) } : {};
  const current = getAgentSettings(base);
  const next = { ...current, ...settings };
  base._greeting = next.greeting.trim();
  base._starters = readStrArray(next.starters, 3);
  base._fallbackMessage = next.fallbackMessage.trim();
  base._strictKnowledge = next.strictKnowledge === true;
  base._maxToolIterations = Math.min(Math.max(Math.round(next.maxToolIterations) || 4, 1), 8);
  return base;
}

/** Model families that ignore a custom temperature at the gateway. */
export function modelSupportsTemperature(model: string | null | undefined): boolean {
  return !String(model ?? "").startsWith("openai/gpt-5");
}

export const MAX_TOKEN_PRESETS = [
  { value: 512, labelTh: "สั้น (~1 ย่อหน้า)", labelEn: "Short (~1 paragraph)" },
  { value: 1024, labelTh: "ปานกลาง (~2-3 ย่อหน้า)", labelEn: "Medium (~2-3 paragraphs)" },
  { value: 2048, labelTh: "ยาว (คำตอบละเอียด)", labelEn: "Long (detailed answer)" },
  { value: 4096, labelTh: "ยาวมาก (รายงาน)", labelEn: "Very long (report)" },
];

/**
 * Snapshot the selected skill names against the user's catalog so the agent
 * carries the actual instructions, not just a label.
 */
export function toSkillEntries(
  names: string[],
  catalog: { name: string; instructions?: string | null }[],
): SkillEntry[] {
  return names.map((n) => {
    const hit = catalog.find((c) => c.name.toLowerCase() === n.trim().toLowerCase());
    return { name: n.trim(), instructions: (hit?.instructions ?? "").trim() };
  });
}

/** Mirrors the server-side skill block, used by the builder preview. */
export function renderSkillBlock(skills: SkillEntry[]): string {
  if (skills.length === 0) return "";
  const body = skills
    .map((x) =>
      x.instructions
        ? `- ${x.name}\n  How to apply this skill:\n${x.instructions.split("\n").map((l) => `    ${l}`).join("\n")}`
        : `- ${x.name}`,
    )
    .join("\n");
  return `\n\n---\nSpecialised skills you must apply in every answer:\n${body}\nFollow each skill's instructions exactly.\n---`;
}
