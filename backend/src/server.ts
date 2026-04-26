import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import timesheetRouter from "./routes/timesheet.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// routes
app.use("/timesheet", timesheetRouter);

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
