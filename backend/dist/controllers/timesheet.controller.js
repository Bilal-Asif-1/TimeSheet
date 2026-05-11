"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimesheet = exports.updateTimesheet = exports.getTimesheets = exports.addTimesheet = void 0;
const db_1 = require("../config/db");
/*
// legacy mssql code (kept for rollback)
import sql, { connectDB } from "../config/db";
*/
// CREATE
const addTimesheet = async (req, res) => {
    try {
        const appUser = req.appUser;
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { task, hours } = req.body;
        const pool = await (0, db_1.connectDB)();
        await pool.query(`INSERT INTO timesheets (task, hours, "userId") VALUES ($1, $2, $3)`, [
            task,
            Number(hours),
            appUser.userId,
        ]);
        res.status(200).json({ message: "Timesheet added successfully" });
    }
    catch (err) {
        console.error("ADD ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.addTimesheet = addTimesheet;
// READ
const getTimesheets = async (req, res) => {
    try {
        const appUser = req.appUser;
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const pool = await (0, db_1.connectDB)();
        const result = await pool.query(`SELECT id, task, hours, "userId"
       FROM timesheets
       WHERE "userId" = $1
       ORDER BY id DESC`, [appUser.userId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error("GET ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};
exports.getTimesheets = getTimesheets;
const updateTimesheet = async (req, res) => {
    try {
        const appUser = req.appUser;
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const { task, hours } = req.body;
        const pool = await (0, db_1.connectDB)();
        await pool.query(`UPDATE timesheets
       SET task = $1, hours = $2
       WHERE id = $3 AND "userId" = $4`, [task, Number(hours), Number(id), appUser.userId]);
        res.json({ message: "Timesheet updated" });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
};
exports.updateTimesheet = updateTimesheet;
const deleteTimesheet = async (req, res) => {
    try {
        const appUser = req.appUser;
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id } = req.params;
        const pool = await (0, db_1.connectDB)();
        await pool.query(`DELETE FROM timesheets WHERE id = $1 AND "userId" = $2`, [
            Number(id),
            appUser.userId,
        ]);
        res.json({ message: "Timesheet deleted" });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
};
exports.deleteTimesheet = deleteTimesheet;
