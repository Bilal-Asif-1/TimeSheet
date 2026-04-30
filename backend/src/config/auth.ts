import dotenv from "dotenv";

dotenv.config();

// Microsoft Entra ID (Azure AD) settings from .env
export const authConfig = {
  clientId: process.env.MS_CLIENT_ID || "",
  clientSecret: process.env.MS_CLIENT_SECRET || "",
  tenantId: process.env.MS_TENANT_ID || "",
  redirectUri:
    process.env.MS_REDIRECT_URI || "http://localhost:5001/auth/microsoft/callback",
};

// This is the authority URL for your tenant.
export const authority = `https://login.microsoftonline.com/${authConfig.tenantId}`;

// These scopes are enough to sign in and read basic profile.
export const loginScopes = ["openid", "profile", "email", "User.Read"];
