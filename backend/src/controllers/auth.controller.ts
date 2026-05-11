import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/db";

/*
// legacy mssql code (kept for rollback)
import sql, { connectDB } from "../config/db";
*/

const issueAppToken = (payload: {
  userId: number;
  email: string;
  name: string;
  provider: "local" | "microsoft";
}) => {
  const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

// Registers a local user account and returns an app token.
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    const pool = await connectDB();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [
      normalizedEmail,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Account already exists for this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `INSERT INTO users (name, email, "passwordHash", provider)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, provider`,
      [name.trim(), normalizedEmail, passwordHash, "local"],
    );

    const user = inserted.rows[0];
    const token = issueAppToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    return res.status(201).json({ token, user });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

// Logs in an existing local user and returns an app token.
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const pool = await connectDB();
    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `SELECT id, name, email, "passwordHash", provider
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = result.rows[0];

    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ error: "This account uses Microsoft sign-in. Use Continue with Microsoft." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};

// Upserts user from verified Microsoft token claims and returns app token.
export const microsoftSync = async (req: Request, res: Response) => {
  try {
    const claims = (req as Request & { user?: Record<string, string> }).user;
    const email = claims?.preferred_username?.toLowerCase().trim();
    const oid = claims?.oid;
    const name = claims?.name || "Microsoft User";

    if (!email || !oid) {
      return res.status(400).json({ error: "Missing required Microsoft claims." });
    }

    const pool = await connectDB();
    const existing = await pool.query(
      `SELECT id, name, email, provider
       FROM users
       WHERE email = $1 OR "microsoftOid" = $2
       LIMIT 1`,
      [email, oid],
    );

    let user = existing.rows[0];
    if (!user) {
      const inserted = await pool.query(
        `INSERT INTO users (name, email, provider, "microsoftOid")
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, provider`,
        [name, email, "microsoft", oid],
      );
      user = inserted.rows[0];
    }

    const token = issueAppToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    return res.json({ token, user });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};
