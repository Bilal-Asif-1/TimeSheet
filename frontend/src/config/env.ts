function requireViteEnv(key: string): string {
  const value = (import.meta.env as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[config] Missing required Vite env var ${key}. This app is a static build; set it at build time (e.g. in frontend/.env) and rebuild the frontend image.`,
    );
  }
  return value.trim();
}

function normalizeBaseUrl(url: string): string {
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

  const host = parsed.hostname.toLowerCase();
  const isLocalHost =
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  if (isLocalHost && !import.meta.env.DEV) {
    throw new Error(
      `[config] VITE_API_BASE_URL points at "${parsed.hostname}", which will not work for browser clients in production. Use your EC2 public IP (or a reverse-proxy path) and rebuild.`,
    );
  }

  return normalized;
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(requireViteEnv("VITE_API_BASE_URL"));
}

export function getAppOrigin(): string {
  const value = requireViteEnv("VITE_APP_ORIGIN").replace(/\/+$/, "");
  // Allow http(s) or file-less origin-like strings; validate if it looks like a URL.
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

