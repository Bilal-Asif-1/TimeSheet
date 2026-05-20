"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = void 0;
const db_1 = require("../config/db");
const requestUser_1 = require("../utils/requestUser");
const validateDepartmentRequest = (req, res) => {
    const appUser = (0, requestUser_1.getAppUser)(req);
    if (!appUser?.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return null;
    }
    if (!appUser.organizationId) {
        res.status(400).json({ error: "Join or create an organization first." });
        return null;
    }
    if (!(0, requestUser_1.isOrganizationAdmin)(appUser)) {
        res.status(403).json({ error: "Only organization admins can manage departments." });
        return null;
    }
    return appUser;
};
const createDepartment = async (req, res) => {
    try {
        const appUser = validateDepartmentRequest(req, res);
        if (!appUser)
            return;
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
        return res.status(500).json({ error: error.message });
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    try {
        const appUser = validateDepartmentRequest(req, res);
        if (!appUser)
            return;
        const { name, description } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: "Department name is required." });
        }
        const pool = await (0, db_1.connectDB)();
        const updated = await pool.query(`UPDATE departments
       SET name = $1, description = $2
       WHERE id = $3 AND "organizationId" = $4
       RETURNING id, name, description, "createdAt"`, [name.trim(), description?.trim() || null, Number(req.params.id), appUser.organizationId]);
        if (updated.rows.length === 0) {
            return res.status(404).json({ error: "Department was not found." });
        }
        return res.json({ department: updated.rows[0] });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const appUser = validateDepartmentRequest(req, res);
        if (!appUser)
            return;
        const pool = await (0, db_1.connectDB)();
        const deleted = await pool.query(`DELETE FROM departments
       WHERE id = $1 AND "organizationId" = $2
       RETURNING id`, [Number(req.params.id), appUser.organizationId]);
        if (deleted.rows.length === 0) {
            return res.status(404).json({ error: "Department was not found." });
        }
        return res.json({ message: "Department deleted." });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteDepartment = deleteDepartment;
