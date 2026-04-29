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

export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { task, hours } = req.body;

    const pool = await connectDB();

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("task", sql.VarChar, task)
      .input("hours", sql.Int, hours).query(`
        UPDATE Timesheets
        SET task = @task, hours = @hours
        WHERE id = @id
      `);

    res.json({ message: "Timesheet updated" });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};

export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pool = await connectDB();

    await pool.request().input("id", sql.Int, id).query(`
        DELETE FROM Timesheets
        WHERE id = @id
      `);

    res.json({ message: "Timesheet deleted" });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
};
