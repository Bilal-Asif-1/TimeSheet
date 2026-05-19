"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const task_controller_1 = require("../controllers/task.controller");
const router = express_1.default.Router();
const uploadDir = path_1.default.join(process.cwd(), "uploads", "tasks");
fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 8,
    },
});
router.use(verifyAppToken_1.verifyAppToken);
router.get("/", task_controller_1.getTasks);
router.post("/", upload.array("attachments", 8), task_controller_1.createTask);
router.post("/:id/start", task_controller_1.startTask);
router.post("/:id/stop", task_controller_1.stopTask);
router.post("/:id/complete", task_controller_1.completeTask);
exports.default = router;
