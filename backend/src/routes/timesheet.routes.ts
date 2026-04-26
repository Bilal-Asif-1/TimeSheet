import express from "express";
import {
  addTimesheet,
  getTimesheets,
} from "../controllers/timesheet.controller";

const router = express.Router();

router.post("/", addTimesheet);
router.get("/", getTimesheets);

export default router;
