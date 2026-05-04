"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSchema = exports.connectDB = void 0;
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // 🔥 Docker: this becomes "mssql"
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};
let pool = null;
// 🔥 Retry logic for Docker startup
const connectWithRetry = async (retries = 5) => {
    try {
        const connection = await mssql_1.default.connect(config);
        console.log("✅ MSSQL Connected");
        return connection;
    }
    catch (err) {
        console.error(`❌ DB connection failed. Retries left: ${retries}`);
        if (retries === 0) {
            throw err;
        }
        await new Promise((res) => setTimeout(res, 3000)); // wait 3 sec
        return connectWithRetry(retries - 1);
    }
};
const connectDB = async () => {
    if (!pool) {
        pool = await connectWithRetry();
    }
    return pool;
};
exports.connectDB = connectDB;
// 🔥 Schema setup (same as yours, just safer flow)
const ensureSchema = async () => {
    const dbPool = await (0, exports.connectDB)();
    await dbPool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users'
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
      ALTER TABLE Timesheets ADD userId INT NULL;
    END
  `);
    await dbPool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
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
exports.ensureSchema = ensureSchema;
exports.default = mssql_1.default;
