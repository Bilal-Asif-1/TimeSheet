import { Request, Response, NextFunction } from "express";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { authConfig } from "../config/auth";

type JwtPayloadWithClaims = jwt.JwtPayload & {
  aud?: string;
  tid?: string;
  oid?: string;
  preferred_username?: string;
  name?: string;
};

const client = jwksClient({
  // "common" lets us validate tokens from any Microsoft tenant/account type.
  jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
});

// Reads signing key from Microsoft public keys endpoint.
const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
  if (!header.kid) {
    callback(new Error("Token header does not contain kid"));
    return;
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }

    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

// Middleware to protect routes with Microsoft access token
export const verifyMicrosoftToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token." });
  }

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      audience: authConfig.clientId,
    },
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
      }

      // Attach decoded user info for next handlers.
      (req as Request & { user?: JwtPayloadWithClaims }).user =
        decoded as JwtPayloadWithClaims;
      return next();
    },
  );
};
