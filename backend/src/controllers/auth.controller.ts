import { Request, Response } from "express";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import { authConfig, authority, loginScopes } from "../config/auth";

const msalConfiguration: Configuration = {
  auth: {
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    authority,
  },
};

const cca = new ConfidentialClientApplication(msalConfiguration);

// Step 1: Send user to Microsoft login page
export const microsoftLogin = async (_req: Request, res: Response) => {
  try {
    if (!authConfig.clientId || !authConfig.clientSecret || !authConfig.tenantId) {
      return res.status(500).json({
        error: "Microsoft auth env values are missing.",
      });
    }

    const url = await cca.getAuthCodeUrl({
      scopes: loginScopes,
      redirectUri: authConfig.redirectUri,
    });

    return res.redirect(url);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

// Step 2: Microsoft sends ?code=... here, then we exchange it for tokens
export const microsoftCallback = async (req: Request, res: Response) => {
  try {
    const authCode = req.query.code as string | undefined;

    if (!authCode) {
      return res.status(400).json({ error: "Authorization code is missing." });
    }

    const tokenResponse = await cca.acquireTokenByCode({
      code: authCode,
      scopes: loginScopes,
      redirectUri: authConfig.redirectUri,
    });

    return res.status(200).json({
      message: "Microsoft login successful",
      account: tokenResponse?.account ?? null,
      idToken: tokenResponse?.idToken ?? null,
      accessToken: tokenResponse?.accessToken ?? null,
      expiresOn: tokenResponse?.expiresOn ?? null,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};
