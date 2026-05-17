"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepartment = exports.getOrganizationOverview = void 0;
const db_1 = require("../config/db");
const getAppUser = (req) => req.appUser;
const getOrganizationOverview = async (req, res) => {
    try {
        const appUser = getAppUser(req);
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!appUser.organizationId && !appUser.organizationCode) {
            return res.json({
                organization: null,
                departments: [],
                employees: [],
                stats: { employees: 0, departments: 0, totalHours: 0, activeRoles: 0 },
            });
        }
        const pool = await (0, db_1.connectDB)();
        const orgResult = await pool.query(`SELECT id, "orgCode", name, "companyEmail", industry, "teamSize", "createdAt"
       FROM organizations
       WHERE id = $1 OR UPPER("orgCode") = UPPER($2)
       LIMIT 1`, [appUser.organizationId || null, appUser.organizationCode || null]);
        if (orgResult.rows.length === 0) {
            return res.status(404).json({ error: "Organization was not found." });
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
