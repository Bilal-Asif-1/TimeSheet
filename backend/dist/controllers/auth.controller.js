"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.microsoftSync = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
/*
// legacy mssql code (kept for rollback)
import sql, { connectDB } from "../config/db";
*/
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
        const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [
            normalizedEmail,
        ]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Account already exists for this email." });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const inserted = await pool.query(`INSERT INTO users (name, email, "passwordHash", provider)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, provider`, [name.trim(), normalizedEmail, passwordHash, "local"]);
        const user = inserted.rows[0];
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
        const result = await pool.query(`SELECT id, name, email, "passwordHash", provider
       FROM users
       WHERE email = $1
       LIMIT 1`, [normalizedEmail]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const user = result.rows[0];
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
        const existing = await pool.query(`SELECT id, name, email, provider
       FROM users
       WHERE email = $1 OR "microsoftOid" = $2
       LIMIT 1`, [email, oid]);
        let user = existing.rows[0];
        if (!user) {
            const inserted = await pool.query(`INSERT INTO users (name, email, provider, "microsoftOid")
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, provider`, [name, email, "microsoft", oid]);
            user = inserted.rows[0];
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
