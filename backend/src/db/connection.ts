import sql from "mssql";
import dotenv from "dotenv";

// Load .env values so database credentials are available.
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

export const connectDB = async () => {
  try {
    // Create SQL connection.
    await sql.connect(config);
    console.log("✅ SQL Connected");
  } catch (err) {
    // Print connection error if DB is not reachable.
    console.error("DB Error:", err);
  }
};

// Export SQL object if another file needs query helpers/types.
export default sql;
