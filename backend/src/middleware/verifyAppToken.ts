import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type AppJwtPayload = jwt.JwtPayload & {
  userId: number;
  email: string;
  name: string;
  provider: "local" | "microsoft";
  organizationId?: number | null;
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

export const verifyAppToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing app token." });
  }

  try {
    const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
    const decoded = jwt.verify(token, secret) as AppJwtPayload;
    (req as Request & { appUser?: AppJwtPayload }).appUser = decoded;
    return next();
  } catch (_error) {
    return res.status(403).json({ error: "Invalid or expired app token." });
  }
};
