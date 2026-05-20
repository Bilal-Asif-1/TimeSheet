import { Request, Response } from "express";
import { connectDB } from "../config/db";
import { issueAppToken } from "../utils/appToken";
import { getAppUser } from "../utils/requestUser";

export const joinOrganization = async (req: Request, res: Response) => {
  try {
    const appUser = getAppUser(req);
    if (!appUser?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { organizationId, department } = req.body as {
      organizationId?: string;
      department?: string;
    };

    if (!organizationId?.trim()) {
      return res.status(400).json({ error: "Organization ID is required." });
    }

    const pool = await connectDB();
    const orgResult = await pool.query(
      `SELECT id, "orgCode"
       FROM organizations
       WHERE UPPER("orgCode") = UPPER($1)
       LIMIT 1`,
      [organizationId.trim()],
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization ID was not found." });
    }

    const organization = orgResult.rows[0];
    await pool.query(
      `INSERT INTO organization_members ("userId", "organizationId", role, department, "membershipType")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("userId", "organizationId")
       DO UPDATE SET department = COALESCE(EXCLUDED.department, organization_members.department)`,
      [appUser.userId, organization.id, "employee", department?.trim() || null, "joined"],
    );

    const updated = await pool.query(
      `UPDATE users
       SET "organizationId" = $1,
           "organizationCode" = $2,
           role = CASE WHEN role = 'ceo' AND "organizationId" = $1 THEN role ELSE 'employee' END,
           department = COALESCE($3, department)
       WHERE id = $4
       RETURNING id, name, email, provider, "organizationId", "organizationCode", role, department`,
      [organization.id, organization.orgCode, department?.trim() || null, appUser.userId],
    );

    const user = updated.rows[0];
    const token = issueAppToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      organizationId: user.organizationId,
      organizationCode: user.organizationCode,
      role: user.role,
      department: user.department,
    });

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
};
