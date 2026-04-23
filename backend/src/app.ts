import express from "express";
import cors from "cors";
import timesheetRoutes from "./routes/timesheet.routes";

// This file builds the app (middlewares + routes).
// Think of this as "class setup" before school starts.
const app = express();

// Allow frontend/Postman requests from different origins.
app.use(cors());

// Parse incoming JSON request body.
app.use(express.json());

// Global request logger:
// Shows every request method + URL in terminal.
app.use((req, _res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

// All timesheet routes start with /timesheet
app.use("/timesheet", timesheetRoutes);

export default app;
