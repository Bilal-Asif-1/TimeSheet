function requireViteEnv(key: string): string {
  // Required env missing ho to app ko galat URL ke sath chalne nahi dete.
  const value = (import.meta.env as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[config] Missing required Vite env var ${key}. This app is a static build; set it at build time (e.g. in frontend/.env) and rebuild the frontend image.`,
    );
  }
  return value.trim();
}

function normalizeBaseUrl(url: string): string {
  // API URL ke end se extra slash hata kar valid HTTP/HTTPS URL confirm hota hai.
  const normalized = url.replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(
      `[config] Invalid URL in VITE_API_BASE_URL: "${url}". Expected a full http(s) URL like "http://18.232.85.119:5001".`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`[config] VITE_API_BASE_URL must start with http:// or https:// (got ${parsed.protocol}).`);
  }

  return normalized;
}

export function getApiBaseUrl(): string {
  // Axios ke liye backend ka final base URL return hota hai.
  return normalizeBaseUrl(requireViteEnv("VITE_API_BASE_URL"));
}

export function getAppOrigin(): string {
  // Frontend ka apna origin Microsoft redirect aur logout mein use hota hai.
  const value = requireViteEnv("VITE_APP_ORIGIN").replace(/\/+$/, "");
  // Sirf valid HTTP/HTTPS origin allow kiya jata hai.
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(
      `[config] Invalid URL in VITE_APP_ORIGIN: "${value}". Expected a full http(s) URL like "http://18.232.85.119".`,
    );
  }
  return value;
}
