"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimesheet = exports.updateTimesheet = exports.getTimesheets = exports.addTimesheet = void 0;
const db_1 = __importStar(require("../config/db"));
// CREATE
const addTimesheet = async (req, res) => {
    try {
        const appUser = req.appUser;
        if (!appUser?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { task, hours } = req.body;
        const pool = await (0, db_1.connectDB)();
        await pool
            .request()
            .input("task", db_1.default.VarChar, task)
            .input("hours", db_1.default.Int, hours)
            .input("userId", db_1.default.Int, appUser.userId).query(`
        INSERT INTO Timesheets (task, hours, userId)
        VALUES (@task, @hours, @userId)
      `);
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
        const result = await pool
            .request()
            .input("userId", db_1.default.Int, appUser.userId).query(`
        SELECT id, task, hours, userId
        FROM Timesheets
        WHERE userId = @userId
        ORDER BY id DESC
      `);
        res.json(result.recordset);
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
        await pool
            .request()
            .input("id", db_1.default.Int, id)
            .input("task", db_1.default.VarChar, task)
            .input("hours", db_1.default.Int, hours)
            .input("userId", db_1.default.Int, appUser.userId).query(`
        UPDATE Timesheets
        SET task = @task, hours = @hours
        WHERE id = @id AND userId = @userId
      `);
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
        await pool
            .request()
            .input("id", db_1.default.Int, id)
            .input("userId", db_1.default.Int, appUser.userId).query(`
        DELETE FROM Timesheets
        WHERE id = @id AND userId = @userId
      `);
        res.json({ message: "Timesheet deleted" });
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
};
exports.deleteTimesheet = deleteTimesheet;
