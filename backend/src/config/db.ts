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
        microsoftOid NVARCHAR(120) NULL,
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
      )
    END
  `);

  // Ensure microsoftOid is unique only when present.
  // SQL Server unique constraints on nullable columns can reject multiple NULL rows.
  await db.request().query(`
    DECLARE @dropConstraintsSql NVARCHAR(MAX) = N'';

    SELECT @dropConstraintsSql +=
      N'ALTER TABLE dbo.Users DROP CONSTRAINT [' + kc.name + N'];'
    FROM sys.key_constraints kc
    INNER JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
    INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE kc.[type] = 'UQ'
      AND kc.parent_object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'microsoftOid';

    IF LEN(@dropConstraintsSql) > 0
      EXEC sp_executesql @dropConstraintsSql;
  `);

  await db.request().query(`
    DECLARE @dropIndexesSql NVARCHAR(MAX) = N'';

    SELECT @dropIndexesSql +=
      N'DROP INDEX [' + i.name + N'] ON dbo.Users;'
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID('dbo.Users')
      AND i.is_unique = 1
      AND i.is_primary_key = 0
      AND i.is_unique_constraint = 0
      AND c.name = 'microsoftOid'
      AND i.name <> 'UX_Users_MicrosoftOid_NotNull';

    IF LEN(@dropIndexesSql) > 0
      EXEC sp_executesql @dropIndexesSql;
  `);

  await db.request().query(`
    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('dbo.Users')
        AND name = 'UX_Users_MicrosoftOid_NotNull'
    )
    BEGIN
      CREATE UNIQUE INDEX UX_Users_MicrosoftOid_NotNull
      ON dbo.Users(microsoftOid)
      WHERE microsoftOid IS NOT NULL;
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
