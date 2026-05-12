import express from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
import { connectDB, ensureSchema } from "./config/db";
import timesheetRouter from "./routes/timesheet.routes";
import authRouter from "./routes/auth.routes";

const app = express();

/** Browser origins allowed for credentialed requests (never use "*" here). */
function getAllowedOrigins(): Set<string> {
  const set = new Set<string>();
  const addCsv = (raw?: string) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      const o = part.trim();
      if (o.length > 0 && o !== "*") set.add(o);
    }
  };

  if (process.env.CORS_ORIGINS) {
    addCsv(process.env.CORS_ORIGINS);
  } else {
    addCsv("http://18.232.85.119,http://localhost:5173");
    addCsv(process.env.CLIENT_URL);
  }

  return set;
}

const allowedOrigins = getAllowedOrigins();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl, server-to-server, or some tools omit Origin.
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.has(origin)) {
      // With credentials: reflect the exact origin string (required; no wildcard).
      callback(null, origin);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

// routes
app.use("/timesheet", timesheetRouter);
app.use("/auth", authRouter);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    // 1. DB connect
    await connectDB();

    // 2. schema ensure
    await ensureSchema();

    // 3. start server ONLY after DB is ready
    app.listen(Number(PORT), HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    // hard fail (important in Docker / production)
    process.exit(1);
  }
};

startServer();
