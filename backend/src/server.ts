import express from "express";
import cors from "cors";
import { connectDB, ensureSchema } from "./config/db";
import timesheetRouter from "./routes/timesheet.routes";
import authRouter from "./routes/auth.routes";

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// routes
app.use("/timesheet", timesheetRouter);
app.use("/auth", authRouter);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // 1. DB connect
    await connectDB();

    // 2. schema ensure
    await ensureSchema();

    // 3. start server ONLY after DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    // hard fail (important in Docker / production)
    process.exit(1);
  }
};

startServer();
