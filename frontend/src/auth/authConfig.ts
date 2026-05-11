import { PublicClientApplication } from "@azure/msal-browser";
import type { RedirectRequest } from "@azure/msal-browser";

const appOrigin = import.meta.env.VITE_APP_ORIGIN || window.location.origin;
const isLocalhost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const supportsSecureCrypto = window.isSecureContext || isLocalhost;
const authMode = (import.meta.env.VITE_AUTH_MODE || "microsoft").toLowerCase();

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || "1ba6917a-f4c0-49ef-a189-7c57ffd79b50",
    // "common" allows personal Microsoft accounts + organizational tenants.
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_MS_TENANT_ID || "common"
    }`,
    redirectUri: import.meta.env.VITE_MS_REDIRECT_URI || appOrigin,
  },
};

// Scopes we ask from Microsoft during login.
export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export const isMicrosoftAuthEnabled = authMode !== "local-only";
export const msalEnabled = isMicrosoftAuthEnabled && supportsSecureCrypto;

export const msalDisabledReason = !isMicrosoftAuthEnabled
  ? "Microsoft sign-in is disabled by VITE_AUTH_MODE=local-only."
  : "Microsoft sign-in requires HTTPS (or localhost). Use local login on HTTP deployments.";

export const msalInstance = msalEnabled ? new PublicClientApplication(msalConfig) : null;
