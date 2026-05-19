import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { verifyAppToken } from "../middleware/verifyAppToken";
import {
  completeTask,
  createTask,
  getTasks,
  startTask,
  stopTask,
} from "../controllers/task.controller";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads", "tasks");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 8,
  },
});

router.use(verifyAppToken);

router.get("/", getTasks);
router.post("/", upload.array("attachments", 8), createTask);
router.post("/:id/start", startTask);
router.post("/:id/stop", stopTask);
router.post("/:id/complete", completeTask);

export default router;
