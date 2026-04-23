import sql from "mssql";
import dotenv from "dotenv";

// Load variables from .env file into process.env
dotenv.config();

// Database settings read from .env
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

// Keep one shared pool for the full app lifetime.
// This prevents opening a new DB connection for every request.
let pool: sql.ConnectionPool | null = null;

export const connectDB = async () => {
  // Reuse existing connection if already connected.
  if (pool) return pool;

  // First-time connection.
  pool = await sql.connect(config);
  console.log("✅ MSSQL Connected");
  return pool;
};

// Export SQL object so controllers can use data types (VarChar, Int, etc.)
export default sql;
