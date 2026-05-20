import { Request } from "express";

export type AppUser = {
  userId: number;
  email?: string;
  name?: string;
  provider?: "local" | "microsoft";
  organizationId?: number | null;
  organizationCode?: string | null;
  role?: string | null;
  department?: string | null;
};

export const getAppUser = (req: Request) => (req as Request & { appUser?: AppUser }).appUser;

export const isOrganizationAdmin = (user?: AppUser) =>
  user?.role === "ceo" || user?.role === "manager";
