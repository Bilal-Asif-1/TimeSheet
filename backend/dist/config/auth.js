"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginScopes = exports.authority = exports.authConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Microsoft Entra ID (Azure AD) settings from .env
exports.authConfig = {
    clientId: process.env.MS_CLIENT_ID || "",
    clientSecret: process.env.MS_CLIENT_SECRET || "",
    tenantId: process.env.MS_TENANT_ID || "",
    redirectUri: process.env.MS_REDIRECT_URI || "http://localhost:5001/auth/microsoft/callback",
};
// This is the authority URL for your tenant.
exports.authority = `https://login.microsoftonline.com/${exports.authConfig.tenantId}`;
// These scopes are enough to sign in and read basic profile.
exports.loginScopes = ["openid", "profile", "email", "User.Read"];
