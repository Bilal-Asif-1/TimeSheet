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

// Creates/updates required tables in-place at startup.
// We intentionally avoid migrations for now as requested.
export const ensureSchema = async () => {
  const dbPool = await connectDB();

  await dbPool.request().query(`
    IF NOT EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'Users'
    )
    BEGIN
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(120) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NULL,
        provider NVARCHAR(30) NOT NULL DEFAULT 'local',
        microsoftOid NVARCHAR(120) NULL UNIQUE,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
      )
    END
  `);

  await dbPool.request().query(`
    IF COL_LENGTH('Timesheets', 'userId') IS NULL
    BEGIN
      ALTER TABLE Timesheets
      ADD userId INT NULL;
    END
  `);

  await dbPool.request().query(`
    IF NOT EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME = 'Timesheets'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND CONSTRAINT_NAME = 'FK_Timesheets_Users_userId'
    )
    BEGIN
      ALTER TABLE Timesheets
      ADD CONSTRAINT FK_Timesheets_Users_userId
      FOREIGN KEY (userId) REFERENCES Users(id);
    END
  `);
};

export default sql;
