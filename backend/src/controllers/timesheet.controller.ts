import { Request, Response } from "express";
import sql, { connectDB } from "../config/db";

// Controller = the place where real work happens for each route.
// Route file sends request here, then this file talks to the database.
export const addTimesheet = async (req: Request, res: Response) => {
  try {
    // Read values from request body sent by Postman/frontend.
    const { task, hours } = req.body;

    // Get shared database connection pool.
    const pool = await connectDB();

    // Insert one row into Timesheets table using safe SQL inputs.
    await pool
      .request()
      .input("task", sql.VarChar, task)
      .input("hours", sql.Int, hours).query(`
        INSERT INTO Timesheets (task, hours)
        VALUES (@task, @hours)
      `);

    // Send success response.
    res.status(200).json({ message: "Timesheet added" });
  } catch (err: unknown) {
    const error = err as Error;
    // Send readable error response if anything fails.
    res.status(500).json({ error: error.message });
  }
};

export const getTimesheets = async (_req: Request, res: Response) => {
  try {
    // Get shared database connection pool.
    const pool = await connectDB();

    // Read all rows from Timesheets table.
    const result = await pool.request().query(`
      SELECT * FROM Timesheets
    `);

    // Send array of rows back to client.
    res.json(result.recordset);
  } catch (err: unknown) {
    const error = err as Error;
    // Send readable error response if anything fails.
    res.status(500).json({ error: error.message });
  }
};
