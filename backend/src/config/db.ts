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

let pool: sql.ConnectionPool | null = null;

const connectWithRetry = async (retries = 5): Promise<sql.ConnectionPool> => {
  try {
    pool = await sql.connect(config);
    console.log("✅ MSSQL Connected");
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

  await db.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
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

  await db.request().query(`
    IF COL_LENGTH('Timesheets', 'userId') IS NULL
    BEGIN
      ALTER TABLE Timesheets ADD userId INT NULL;
    END
  `);

  await db.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME = 'Timesheets'
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
