import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        aud?: string;
        tid?: string;
        oid?: string;
        preferred_username?: string;
        name?: string;
      };
      appUser?: JwtPayload & {
        userId: number;
        email: string;
        name: string;
        provider: "local" | "microsoft";
      };
    }
  }
}

export {};
