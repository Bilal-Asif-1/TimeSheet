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

let pool: Pool | null = null;

const connectWithRetry = async (retries = 10): Promise<Pool> => {
  try {
    pool = new Pool(config);
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL Connected");
    return pool;
  } catch (err) {
    console.error(`❌ DB connection failed. Retries left: ${retries}`);

    if (retries <= 0) throw err;

    await new Promise((r) => setTimeout(r, 3000));
    return connectWithRetry(retries - 1);
  }
};

export const connectDB = async () => {
  if (!pool) {
    pool = await connectWithRetry();
  }
  return pool;
};

// optional but recommended
export const ensureSchema = async () => {
  const db = await connectDB();

  /*
  // legacy mssql code (kept for rollback)
  await db.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
    BEGIN
      CREATE TABLE Users (...)
    END
  `);
  */

  await db.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      "orgCode" VARCHAR(24) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      "companyEmail" VARCHAR(255) NOT NULL,
      industry VARCHAR(120),
      "teamSize" VARCHAR(60),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      "passwordHash" VARCHAR(255),
      provider VARCHAR(30) NOT NULL DEFAULT 'local',
      "microsoftOid" VARCHAR(120),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS "organizationId" INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "organizationCode" VARCHAR(24),
    ADD COLUMN IF NOT EXISTS role VARCHAR(40) NOT NULL DEFAULT 'employee',
    ADD COLUMN IF NOT EXISTS department VARCHAR(120);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(255),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("organizationId", name)
    );
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_microsoftoid_not_null
    ON users ("microsoftOid")
    WHERE "microsoftOid" IS NOT NULL;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id SERIAL PRIMARY KEY,
      task VARCHAR(255) NOT NULL,
      hours INTEGER NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};
