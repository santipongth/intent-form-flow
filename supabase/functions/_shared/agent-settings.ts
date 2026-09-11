// Extra agent behaviour settings stored inside the `agents.tools` jsonb column
// (underscore-prefixed keys are configuration, everything else is a tool toggle).

export interface AgentSettings {
  userPrompt: string;
  skills: string[];
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

export function readAgentSettings(tools: unknown): AgentSettings {
  if (!tools || typeof tools !== "object") return { ...DEFAULTS };
  const t = tools as Record<string, unknown>;
  const iter = Number(t._maxToolIterations);
  return {
    userPrompt: typeof t._userPrompt === "string" ? t._userPrompt.trim() : "",
    skills: strArray(t._skills, 20),
    greeting: typeof t._greeting === "string" ? t._greeting.trim() : "",
    starters: strArray(t._starters, 3),
    fallbackMessage: typeof t._fallbackMessage === "string" ? t._fallbackMessage.trim() : "",
    strictKnowledge: t._strictKnowledge === true,
    maxToolIterations: Number.isFinite(iter) ? Math.min(Math.max(Math.round(iter), 1), 8) : 4,
  };
}

/** Appends the prompt/skills/answer-scope instructions to a system prompt. */
export function applyAgentSettings(systemPrompt: string, s: AgentSettings, hasKnowledge: boolean): string {
  let out = systemPrompt;
  if (s.userPrompt) {
    out += `\n\n---\nUser Prompt Template (apply when responding):\n${s.userPrompt}\n---`;
  }
  if (s.skills.length > 0) {
    out += `\n\n---\nSpecialised skills you must apply in every answer:\n${
      s.skills.map((x) => `- ${x}`).join("\n")
    }\nLead with these strengths; if a request falls outside them, say so plainly instead of guessing.\n---`;
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
