"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.microsoftSync = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importStar(require("../config/db"));
const issueAppToken = (payload) => {
    const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
};
// Registers a local user account and returns an app token.
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "Name, email and password are required." });
        }
        const pool = await (0, db_1.connectDB)();
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await pool
            .request()
            .input("email", db_1.default.NVarChar, normalizedEmail)
            .query("SELECT TOP 1 id FROM Users WHERE email = @email");
        if (existing.recordset.length > 0) {
            return res.status(409).json({ error: "Account already exists for this email." });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const inserted = await pool
            .request()
            .input("name", db_1.default.NVarChar, name.trim())
            .input("email", db_1.default.NVarChar, normalizedEmail)
            .input("passwordHash", db_1.default.NVarChar, passwordHash)
            .input("provider", db_1.default.NVarChar, "local").query(`
        INSERT INTO Users (name, email, passwordHash, provider)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.provider
        VALUES (@name, @email, @passwordHash, @provider)
      `);
        const user = inserted.recordset[0];
        const token = issueAppToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
        });
        return res.status(201).json({ token, user });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.register = register;
// Logs in an existing local user and returns an app token.
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        const pool = await (0, db_1.connectDB)();
        const normalizedEmail = email.toLowerCase().trim();
        const result = await pool
            .request()
            .input("email", db_1.default.NVarChar, normalizedEmail)
            .query(`
        SELECT TOP 1 id, name, email, passwordHash, provider
        FROM Users
        WHERE email = @email
      `);
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const user = result.recordset[0];
        if (!user.passwordHash) {
            return res
                .status(400)
                .json({ error: "This account uses Microsoft sign-in. Use Continue with Microsoft." });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const token = issueAppToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
        });
        return res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, provider: user.provider },
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.login = login;
// Upserts user from verified Microsoft token claims and returns app token.
const microsoftSync = async (req, res) => {
    try {
        const claims = req.user;
        const email = claims?.preferred_username?.toLowerCase().trim();
        const oid = claims?.oid;
        const name = claims?.name || "Microsoft User";
        if (!email || !oid) {
            return res.status(400).json({ error: "Missing required Microsoft claims." });
        }
        const pool = await (0, db_1.connectDB)();
        const existing = await pool
            .request()
            .input("email", db_1.default.NVarChar, email)
            .input("oid", db_1.default.NVarChar, oid)
            .query(`
        SELECT TOP 1 id, name, email, provider
        FROM Users
        WHERE email = @email OR microsoftOid = @oid
      `);
        let user = existing.recordset[0];
        if (!user) {
            const inserted = await pool
                .request()
                .input("name", db_1.default.NVarChar, name)
                .input("email", db_1.default.NVarChar, email)
                .input("provider", db_1.default.NVarChar, "microsoft")
                .input("oid", db_1.default.NVarChar, oid).query(`
          INSERT INTO Users (name, email, provider, microsoftOid)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.provider
          VALUES (@name, @email, @provider, @oid)
        `);
            user = inserted.recordset[0];
        }
        const token = issueAppToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
        });
        return res.json({ token, user });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ error: err.message });
    }
};
exports.microsoftSync = microsoftSync;
