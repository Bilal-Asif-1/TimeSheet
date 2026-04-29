import type { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: "http://localhost:5173",
  },

  cache: {
    cacheLocation: "sessionStorage",
  },
};

// login scopes
export const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};
