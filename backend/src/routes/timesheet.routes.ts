import express from "express";
import {
  addTimesheet,
  getTimesheets,
} from "../controllers/timesheet.controller";

// This file is the "traffic controller" for timesheet URLs.
// It decides which controller function runs for each route.
const router = express.Router();

// POST /timesheet
// Adds one new timesheet record to the database.
router.post("/", addTimesheet);

// GET /timesheet
// Returns all timesheet records from the database.
router.get("/", getTimesheets);

export default router;
