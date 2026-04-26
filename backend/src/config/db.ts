import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

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

let pool: sql.ConnectionPool;

export const connectDB = async () => {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ MSSQL Connected");
  }
  return pool;
};

export default sql;
