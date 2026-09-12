// Extra agent behaviour settings stored inside the `agents.tools` jsonb column
// (underscore-prefixed keys are configuration, everything else is a tool toggle).

export interface SkillEntry {
  name: string;
  instructions: string;
}

export interface AgentSettings {
  userPrompt: string;
  skills: SkillEntry[];
  greeting: string;
  starters: string[];
  fallbackMessage: string;
  strictKnowledge: boolean;
  maxToolIterations: number;
}

const DEFAULTS: AgentSettings = {
  userPrompt: "",
  skills: [],
  greeting: "",
  starters: [],
  fallbackMessage: "",
  strictKnowledge: false,
  maxToolIterations: 4,
};

function strArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, max);
}

/**
 * `_skills` may be a legacy `string[]` of names, or the newer
 * `{ name, instructions }[]` snapshot. Both are normalised here.
 */
export function readSkillEntries(v: unknown, max = 20): SkillEntry[] {
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
    if (out.length >= max) break;
  }
  return out;
}

export function readAgentSettings(tools: unknown): AgentSettings {
  if (!tools || typeof tools !== "object") return { ...DEFAULTS };
  const t = tools as Record<string, unknown>;
  const iter = Number(t._maxToolIterations);
  return {
    userPrompt: typeof t._userPrompt === "string" ? t._userPrompt.trim() : "",
    skills: readSkillEntries(t._skills, 20),
    greeting: typeof t._greeting === "string" ? t._greeting.trim() : "",
    starters: strArray(t._starters, 3),
    fallbackMessage: typeof t._fallbackMessage === "string" ? t._fallbackMessage.trim() : "",
    strictKnowledge: t._strictKnowledge === true,
    maxToolIterations: Number.isFinite(iter) ? Math.min(Math.max(Math.round(iter), 1), 8) : 4,
  };
}

/** Replaces the `{{question}}` placeholder with the user's latest message. */
export function fillUserPromptPlaceholders(template: string, lastUserMessage = ""): string {
  const q = lastUserMessage.trim();
  return template.replace(
    /\{\{\s*question\s*\}\}/gi,
    q || "(see the user's latest message in this conversation)",
  );
}

/** Appends the prompt/skills/answer-scope instructions to a system prompt. */
export function applyAgentSettings(
  systemPrompt: string,
  s: AgentSettings,
  hasKnowledge: boolean,
  lastUserMessage = "",
): string {
  let out = systemPrompt;
  if (s.userPrompt) {
    out += `\n\n---\nUser Prompt (apply when responding):\n${
      fillUserPromptPlaceholders(s.userPrompt, lastUserMessage)
    }\n---`;
  }
  if (s.skills.length > 0) {
    const body = s.skills
      .map((x) =>
        x.instructions
          ? `- ${x.name}\n  How to apply this skill:\n${
            x.instructions.split("\n").map((l) => `    ${l}`).join("\n")
          }`
          : `- ${x.name}`
      )
      .join("\n");
    out += `\n\n---\nSpecialised skills you must apply in every answer:\n${body}\nFollow each skill's instructions exactly. Lead with these strengths; if a request falls outside them, say so plainly instead of guessing.\n---`;
  }
  if (s.strictKnowledge) {
    out += `\n\n---\nAnswer scope: answer ONLY using the reference documents provided above.${
      hasKnowledge ? "" : " No reference documents matched this question."
    } If the answer is not contained in them, reply exactly with:\n${
      s.fallbackMessage || "I could not find this in the knowledge base."
    }\nNever rely on outside knowledge or guesses.\n---`;
  } else if (s.fallbackMessage) {
    out += `\n\n---\nWhen the knowledge base does not cover the question, say:\n${s.fallbackMessage}\n---`;
  }
  return out;
}
