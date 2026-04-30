import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sql, { connectDB } from "../config/db";

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

    const existing = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
      .query("SELECT TOP 1 id FROM Users WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: "Account already exists for this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await pool
      .request()
      .input("name", sql.NVarChar, name.trim())
      .input("email", sql.NVarChar, normalizedEmail)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("provider", sql.NVarChar, "local").query(`
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

    const result = await pool
      .request()
      .input("email", sql.NVarChar, normalizedEmail)
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
    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("oid", sql.NVarChar, oid)
      .query(`
        SELECT TOP 1 id, name, email, provider
        FROM Users
        WHERE email = @email OR microsoftOid = @oid
      `);

    let user = existing.recordset[0];
    if (!user) {
      const inserted = await pool
        .request()
        .input("name", sql.NVarChar, name)
        .input("email", sql.NVarChar, email)
        .input("provider", sql.NVarChar, "microsoft")
        .input("oid", sql.NVarChar, oid).query(`
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
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ error: err.message });
  }
};
