import { PublicClientApplication } from "@azure/msal-browser";
import type { RedirectRequest } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "1ba6917a-f4c0-49ef-a189-7c57ffd79b50",
    authority:
      "https://login.microsoftonline.com/8adc908e-9241-4552-8c21-c31d7f578a69",
    redirectUri: "http://localhost:5173",
  },
};

// Scopes we ask from Microsoft during login.
export const loginRequest: RedirectRequest = {
  scopes: ["User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
