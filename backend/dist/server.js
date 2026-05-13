"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const timesheet_routes_1 = __importDefault(require("./routes/timesheet.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
/** Canonical form so `http://host` and `http://host:80` match the same allowlist entry. */
function canonicalOrigin(origin) {
    const trimmed = origin.trim();
    try {
        const u = new URL(trimmed);
        const protocol = u.protocol.toLowerCase();
        const host = u.hostname.toLowerCase();
        const port = u.port;
        const defaultPort = protocol === "https:" ? "443" : "80";
        const effectivePort = port || defaultPort;
        if (effectivePort === defaultPort) {
            return `${protocol}//${host}`;
        }
        return `${protocol}//${host}:${effectivePort}`;
    }
    catch {
        return trimmed;
    }
}
/**
 * Allowed browser origins for credentialed CORS (never "*" with credentials).
 * Defaults always merged with env so production IP is not dropped when CORS_ORIGINS is set.
 */
function buildAllowedOriginKeys() {
    const keys = new Set();
    const addCsv = (raw) => {
        if (!raw)
            return;
        for (const part of raw.split(",")) {
            const o = part.trim();
            if (!o || o === "*")
                continue;
            keys.add(canonicalOrigin(o));
        }
    };
    // Local Vite dev (normalized keys). Production/staging: set CLIENT_URL and/or CORS_ORIGINS (e.g. via docker-compose).
    addCsv("http://localhost:5173");
    addCsv("http://127.0.0.1:5173");
    addCsv(process.env.CORS_ORIGINS);
    addCsv(process.env.CLIENT_URL);
    return keys;
}
const allowedOriginKeys = buildAllowedOriginKeys();
console.info(`[cors] Allowed origins (${allowedOriginKeys.size}): ${[...allowedOriginKeys].sort().join(", ")}`);
const corsOptions = {
    origin(origin, callback) {
        // Postman, curl, server-to-server — no Origin header.
        if (!origin) {
            callback(null, true);
            return;
        }
        const key = canonicalOrigin(origin);
        if (allowedOriginKeys.has(key)) {
            // Reflect the browser's Origin value (required when credentials: true; no wildcard).
            callback(null, origin);
            return;
        }
        console.warn(`[cors] Blocked preflight/request — Origin=${JSON.stringify(origin)} canonical=${JSON.stringify(key)} allowed=${JSON.stringify([...allowedOriginKeys].sort())}`);
        // Important: never pass an Error here — `cors` forwards it to `next(err)` and Express returns 500
        // with no CORS headers, which browsers report as a failed preflight.
        callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86400,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// routes
app.use("/timesheet", timesheet_routes_1.default);
app.use("/auth", auth_routes_1.default);
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";
const startServer = async () => {
    try {
        // 1. DB connect
        await (0, db_1.connectDB)();
        // 2. schema ensure
        await (0, db_1.ensureSchema)();
        // 3. start server ONLY after DB is ready
        app.listen(Number(PORT), HOST, () => {
            console.log(`🚀 Server running on ${HOST}:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        // hard fail (important in Docker / production)
        process.exit(1);
    }
};
startServer();
