import type { Configuration, PopupRequest } from "@azure/msal-browser";

// Ye alternate/basic MSAL config file hai; main app authConfig.ts wala setup use karti hai.
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || "YOUR_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID || "common"}`,
    redirectUri: import.meta.env.VITE_MS_REDIRECT_URI || import.meta.env.VITE_APP_ORIGIN,
  },

  cache: {
    cacheLocation: "sessionStorage",
  },
};

// Microsoft Graph se basic user profile read karne ki permission.
export const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};
