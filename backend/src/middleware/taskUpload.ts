import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), "uploads", "tasks");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniquePrefix}-${safeName}`);
  },
});

export const taskUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 8,
  },
});
