"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const taskUpload_1 = require("../middleware/taskUpload");
const task_controller_1 = require("../controllers/task.controller");
const router = express_1.default.Router();
router.use(verifyAppToken_1.verifyAppToken);
router.get("/", task_controller_1.getTasks);
router.post("/", taskUpload_1.taskUpload.array("attachments", 8), task_controller_1.createTask);
router.post("/:id/start", task_controller_1.startTask);
router.post("/:id/stop", task_controller_1.stopTask);
router.post("/:id/complete", task_controller_1.completeTask);
exports.default = router;
