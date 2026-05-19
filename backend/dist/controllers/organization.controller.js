"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepartment = exports.selectOrganization = exports.getOrganizationOverview = exports.createOrganization = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const getAppUser = (req) => req.appUser;
const issueAppToken = (payload) => {
    const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
};
const normalizeOrganizationCode = (value) => value.trim().toUpperCase();
const createOrganization = async (req, res) => {
    try {
        const appUser = getAppUser(req);
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { organizationName, organizationId, industry, teamSize } = req.body;
        if (!organizationName?.trim() || !organizationId?.trim()) {
            return res.status(400).json({ error: "Organization name and Organization ID are required." });
        }
        const orgCode = normalizeOrganizationCode(organizationId);
        if (!/^ORG-[A-Z0-9]{4,12}$/.test(orgCode)) {
            return res
                .status(400)
                .json({ error: "Organization ID must look like ORG-WIMETRIX or ORG-1234." });
        }
        const pool = await (0, db_1.connectDB)();
        const existingCode = await pool.query(`SELECT id FROM organizations WHERE "orgCode" = $1 LIMIT 1`, [orgCode]);
        if (existingCode.rows.length > 0) {
            return res.status(409).json({ error: "Organization ID is already taken." });
        }
        const insertedOrg = await pool.query(`INSERT INTO organizations ("orgCode", name, "companyEmail", industry, "teamSize")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, "orgCode", name, "companyEmail", industry, "teamSize"`, [
            orgCode,
            organizationName.trim(),
            appUser.email || "",
            industry?.trim() || null,
            teamSize?.trim() || null,
        ]);
        const organization = insertedOrg.rows[0];
        await pool.query(`INSERT INTO organization_members ("userId", "organizationId", role, department, "membershipType")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("userId", "organizationId")
       DO UPDATE SET role = EXCLUDED.role,
                     department = EXCLUDED.department,
                     "membershipType" = EXCLUDED."membershipType"`, [appUser.userId, organization.id, "ceo", appUser.department || null, "owned"]);
        const updatedUser = await pool.query(`UPDATE users
       SET "organizationId" = $1, "organizationCode" = $2, role = $3
       WHERE id = $4
       RETURNING id, name, email, provider, "organizationId", "organizationCode", role, department`, [organization.id, organization.orgCode, "ceo", appUser.userId]);
        const user = updatedUser.rows[0];
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
        return res.status(201).json({ token, user, organization });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.createOrganization = createOrganization;
const getOrganizationOverview = async (req, res) => {
    try {
        const appUser = getAppUser(req);
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const pool = await (0, db_1.connectDB)();
        const membershipsResult = await pool.query(`SELECT o.id,
              o."orgCode",
              o.name,
              o."companyEmail",
              o.industry,
              o."teamSize",
              om.role,
              om.department,
              om."membershipType",
              (o.id = $2 OR UPPER(o."orgCode") = UPPER(COALESCE($3, ''))) AS "isActive"
       FROM organization_members om
       INNER JOIN organizations o ON o.id = om."organizationId"
       WHERE om."userId" = $1
       ORDER BY
        CASE om."membershipType" WHEN 'owned' THEN 0 ELSE 1 END,
        o.name ASC`, [appUser.userId, appUser.organizationId || null, appUser.organizationCode || null]);
        const memberships = membershipsResult.rows;
        if (!appUser.organizationId && !appUser.organizationCode) {
            return res.json({
                organization: null,
                memberships,
                ownedOrganizations: memberships.filter((item) => item.membershipType === "owned"),
                joinedOrganizations: memberships.filter((item) => item.membershipType !== "owned"),
                departments: [],
                employees: [],
                stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
            });
        }
        const orgResult = await pool.query(`SELECT id, "orgCode", name, "companyEmail", industry, "teamSize", "createdAt"
       FROM organizations
       WHERE id = $1 OR UPPER("orgCode") = UPPER($2)
       LIMIT 1`, [appUser.organizationId || null, appUser.organizationCode || null]);
        if (orgResult.rows.length === 0) {
            return res.json({
                organization: null,
                memberships,
                ownedOrganizations: memberships.filter((item) => item.membershipType === "owned"),
                joinedOrganizations: memberships.filter((item) => item.membershipType !== "owned"),
                departments: [],
                employees: [],
                stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
            });
        }
        const organization = orgResult.rows[0];
        const departments = await pool.query(`SELECT d.id, d.name, d.description, d."createdAt", COUNT(u.id)::int AS "employeeCount"
       FROM departments d
       LEFT JOIN users u
         ON u."organizationId" = d."organizationId"
        AND LOWER(COALESCE(u.department, '')) = LOWER(d.name)
       WHERE d."organizationId" = $1
       GROUP BY d.id
       ORDER BY d.name ASC`, [organization.id]);
        const employees = await pool.query(`SELECT id, name, email, role, department, provider, "createdAt"
       FROM users
       WHERE "organizationId" = $1
       ORDER BY
        CASE role WHEN 'ceo' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END,
        name ASC`, [organization.id]);
        const hours = await pool.query(`SELECT COALESCE(SUM(t.hours), 0)::int AS "totalHours"
       FROM timesheets t
       INNER JOIN users u ON u.id = t."userId"
       WHERE u."organizationId" = $1`, [organization.id]);
        const activeRoles = new Set(employees.rows.map((employee) => employee.role || "employee"));
        return res.json({
            organization,
            memberships,
            ownedOrganizations: memberships.filter((item) => item.membershipType === "owned"),
            joinedOrganizations: memberships.filter((item) => item.membershipType !== "owned"),
            departments: departments.rows,
            employees: employees.rows,
            stats: {
                employees: employees.rows.length,
                departments: departments.rows.length,
                totalHours: hours.rows[0]?.totalHours || 0,
                activeRoles: activeRoles.size,
            },
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.getOrganizationOverview = getOrganizationOverview;
const selectOrganization = async (req, res) => {
    try {
        const appUser = getAppUser(req);
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { organizationId } = req.body;
        if (!organizationId) {
            return res.status(400).json({ error: "Organization is required." });
        }
        const pool = await (0, db_1.connectDB)();
        const membership = await pool.query(`SELECT om.role,
              om.department,
              o.id AS "organizationId",
              o."orgCode" AS "organizationCode"
       FROM organization_members om
       INNER JOIN organizations o ON o.id = om."organizationId"
       WHERE om."userId" = $1
         AND (o.id::text = $2 OR UPPER(o."orgCode") = UPPER($2))
       LIMIT 1`, [appUser.userId, String(organizationId)]);
        if (membership.rows.length === 0) {
            return res.status(403).json({ error: "You are not a member of this organization." });
        }
        const selected = membership.rows[0];
        const updated = await pool.query(`UPDATE users
       SET "organizationId" = $1,
           "organizationCode" = $2,
           role = $3,
           department = $4
       WHERE id = $5
       RETURNING id, name, email, provider, "organizationId", "organizationCode", role, department`, [
            selected.organizationId,
            selected.organizationCode,
            selected.role,
            selected.department,
            appUser.userId,
        ]);
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
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.selectOrganization = selectOrganization;
const createDepartment = async (req, res) => {
    try {
        const appUser = getAppUser(req);
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!appUser.organizationId) {
            return res.status(400).json({ error: "Join or create an organization first." });
        }
        if (appUser.role !== "ceo" && appUser.role !== "manager") {
            return res.status(403).json({ error: "Only organization admins can add departments." });
        }
        const { name, description } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: "Department name is required." });
        }
        const pool = await (0, db_1.connectDB)();
        const inserted = await pool.query(`INSERT INTO departments ("organizationId", name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT ("organizationId", name)
       DO UPDATE SET description = EXCLUDED.description
       RETURNING id, name, description, "createdAt"`, [appUser.organizationId, name.trim(), description?.trim() || null]);
        return res.status(201).json({ department: inserted.rows[0] });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.createDepartment = createDepartment;
