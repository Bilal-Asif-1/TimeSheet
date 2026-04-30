import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload & {
      aud?: string;
      tid?: string;
      oid?: string;
      preferred_username?: string;
      name?: string;
    };
  }
}
