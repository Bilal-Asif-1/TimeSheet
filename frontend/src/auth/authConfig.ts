import { PublicClientApplication } from "@azure/msal-browser";
import type { RedirectRequest } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "1ba6917a-f4c0-49ef-a189-7c57ffd79b50",
    // "common" allows personal Microsoft accounts + organizational tenants.
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:5173",
  },
};

// Scopes we ask from Microsoft during login.
export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
