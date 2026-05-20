import jwt from "jsonwebtoken";

export type TokenUser = {
  userId: number;
  email: string;
  name: string;
  provider: "local" | "microsoft";
  organizationId?: number | null;
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

export const issueAppToken = (payload: TokenUser) => {
  const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
