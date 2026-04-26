import { Request, Response } from "express";
import sql, { connectDB } from "../config/db";

// CREATE
export const addTimesheet = async (req: Request, res: Response) => {
  try {
    const { task, hours } = req.body;

    const pool = await connectDB();

    await pool
      .request()
      .input("task", sql.VarChar, task)
      .input("hours", sql.Int, hours).query(`
        INSERT INTO Timesheets (task, hours)
        VALUES (@task, @hours)
      `);

    res.status(200).json({ message: "Timesheet added successfully" });
  } catch (err: any) {
    console.error("ADD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// READ
export const getTimesheets = async (_: Request, res: Response) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT * FROM Timesheets
    `);

    res.json(result.recordset);
  } catch (err: any) {
    console.error("GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
