// Single source of truth for turning whatever is stored on an agent into a
// model ID the Lovable AI Gateway actually accepts. Legacy/friendly names
// (e.g. "GPT-4o") otherwise make the gateway answer 400.

export const DEFAULT_MODEL = "openai/gpt-5";

export const SUPPORTED_MODELS = [
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash-lite",
];

const ALIASES: Record<string, string> = {
  "gpt-4o": "openai/gpt-5",
  "gpt4o": "openai/gpt-5",
  "gpt-4omini": "openai/gpt-5-mini",
  "gpt-4o-mini": "openai/gpt-5-mini",
  "gpt-4": "openai/gpt-5",
  "gpt-4turbo": "openai/gpt-5",
  "gpt-4-turbo": "openai/gpt-5",
  "gpt-3.5-turbo": "openai/gpt-5-nano",
  "gpt-5": "openai/gpt-5",
  "gpt-5-mini": "openai/gpt-5-mini",
  "gpt-5-nano": "openai/gpt-5-nano",
  "geminipro": "google/gemini-2.5-pro",
  "gemini-pro": "google/gemini-2.5-pro",
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite",
  "geminiflash": "google/gemini-2.5-flash",
  "gemini-flash": "google/gemini-2.5-flash",
  "claude3.5sonnet": "openai/gpt-5",
  "claude-3.5-sonnet": "openai/gpt-5",
  "claude-3-opus": "openai/gpt-5",
  "claude-3-sonnet": "openai/gpt-5-mini",
  "claude-3-haiku": "openai/gpt-5-nano",
  "llama3.170b": "google/gemini-2.5-flash",
  "mixtral8x7b": "google/gemini-2.5-flash",
};

export function normalizeModel(input: string | null | undefined): string {
  if (!input) return DEFAULT_MODEL;
  const raw = String(input).trim();
  if (!raw) return DEFAULT_MODEL;
  if (SUPPORTED_MODELS.includes(raw)) return raw;
  const key = raw.toLowerCase().replace(/\s+/g, "");
  if (ALIASES[key]) return ALIASES[key];
  // Unknown but vendor-prefixed: pass through so new gateway models keep working.
  if (raw.includes("/")) return raw;
  return DEFAULT_MODEL;
}

/** GPT-5 family rejects any non-default temperature. */
export function supportsCustomTemperature(model: string): boolean {
  return !model.startsWith("openai/gpt-5");
}
