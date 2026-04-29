import express from "express";

import cors from "cors";

const app = express();

app.use(cors()); // ✅ ADD THIS
app.use(express.json());

import {
  addTimesheet,
  getTimesheets,
  updateTimesheet,
  deleteTimesheet,
} from "../controllers/timesheet.controller";

const router = express.Router();

router.get("/", getTimesheets);
router.post("/", addTimesheet);
router.delete("/:id", deleteTimesheet);
router.put("/:id", updateTimesheet);

export default router;
