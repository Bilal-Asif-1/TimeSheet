import express from "express";
import { verifyAppToken } from "../middleware/verifyAppToken";
import { taskUpload } from "../middleware/taskUpload";
import {
  completeTask,
  createTask,
  getTasks,
  startTask,
  stopTask,
} from "../controllers/task.controller";

const router = express.Router();

router.use(verifyAppToken);

router.get("/", getTasks);
router.post("/", taskUpload.array("attachments", 8), createTask);
router.post("/:id/start", startTask);
router.post("/:id/stop", stopTask);
router.post("/:id/complete", completeTask);

export default router;
