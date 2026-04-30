import express from "express";
import { verifyAppToken } from "../middleware/verifyAppToken";

import {
  addTimesheet,
  getTimesheets,
  updateTimesheet,
  deleteTimesheet,
} from "../controllers/timesheet.controller";

const router = express.Router();

// Every timesheet endpoint requires our app token.
router.use(verifyAppToken);

router.get("/", getTimesheets);
router.post("/", addTimesheet);
router.delete("/:id", deleteTimesheet);
router.put("/:id", updateTimesheet);

export default router;
