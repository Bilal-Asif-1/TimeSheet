import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/*
// legacy mssql code (kept for rollback)
import sql from "mssql";
const config: sql.config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
*/

const config = {
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppass",
  database: process.env.DB_NAME || "timesheet",
};

let pool: Pool;

export const connectDB = async () => {
  if (!pool) {
    pool = new Pool(config);
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL Connected");
  }
  return pool;
};
