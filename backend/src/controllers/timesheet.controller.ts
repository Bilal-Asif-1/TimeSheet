import { Request, Response } from "express";
import { connectDB } from "../config/db";

/*
// legacy mssql code (kept for rollback)
import sql, { connectDB } from "../config/db";
*/

// CREATE
export const addTimesheet = async (req: Request, res: Response) => {
  try {
    const appUser = (req as Request & { appUser?: { userId: number } }).appUser;
    if (!appUser?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { task, hours } = req.body;

    const pool = await connectDB();

    await pool.query(`INSERT INTO timesheets (task, hours, "userId") VALUES ($1, $2, $3)`, [
      task,
      Number(hours),
      appUser.userId,
    ]);

    res.status(200).json({ message: "Timesheet added successfully" });
  } catch (err: any) {
    console.error("ADD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// READ
export const getTimesheets = async (req: Request, res: Response) => {
  try {
    const appUser = (req as Request & { appUser?: { userId: number } }).appUser;
    if (!appUser?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pool = await connectDB();

    const result = await pool.query(
      `SELECT id, task, hours, "userId"
       FROM timesheets
       WHERE "userId" = $1
       ORDER BY id DESC`,
      [appUser.userId],
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const appUser = (req as Request & { appUser?: { userId: number } }).appUser;
    if (!appUser?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { task, hours } = req.body;

    const pool = await connectDB();

    await pool.query(
      `UPDATE timesheets
       SET task = $1, hours = $2
       WHERE id = $3 AND "userId" = $4`,
      [task, Number(hours), Number(id), appUser.userId],
    );

    res.json({ message: "Timesheet updated" });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const appUser = (req as Request & { appUser?: { userId: number } }).appUser;
    if (!appUser?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const pool = await connectDB();

    await pool.query(`DELETE FROM timesheets WHERE id = $1 AND "userId" = $2`, [
      Number(id),
      appUser.userId,
    ]);

    res.json({ message: "Timesheet deleted" });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};
