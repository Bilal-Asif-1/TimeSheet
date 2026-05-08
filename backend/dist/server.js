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
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use((0, cors_1.default)({
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express_1.default.json());
// routes
app.use("/timesheet", timesheet_routes_1.default);
app.use("/auth", auth_routes_1.default);
const PORT = process.env.PORT || 5001;
const startServer = async () => {
    try {
        // 1. DB connect
        await (0, db_1.connectDB)();
        // 2. schema ensure
        await (0, db_1.ensureSchema)();
        // 3. start server ONLY after DB is ready
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        // hard fail (important in Docker / production)
        process.exit(1);
    }
};
startServer();
