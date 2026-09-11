const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^0(?:\.\d{1,3}){3}$/,
  /^127(?:\.\d{1,3}){3}$/,
  /^10(?:\.\d{1,3}){3}$/,
  /^192\.168(?:\.\d{1,3}){2}$/,
  /^169\.254(?:\.\d{1,3}){2}$/,
  /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/,
  /^::1$/,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
];

export function normalizePublicUrl(value: string): string {
  const parsed = new URL(value.trim());
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }
  if (parsed.username || parsed.password || !parsed.hostname) {
    throw new Error("URL credentials are not allowed");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname.endsWith(".local") || PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    throw new Error("Private or local network URLs are not allowed");
  }
  parsed.hash = "";
  return parsed.toString();
}