"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const timesheet_controller_1 = require("../controllers/timesheet.controller");
const router = express_1.default.Router();
// Every timesheet endpoint requires our app token.
router.use(verifyAppToken_1.verifyAppToken);
router.get("/", timesheet_controller_1.getTimesheets);
router.post("/", timesheet_controller_1.addTimesheet);
router.delete("/:id", timesheet_controller_1.deleteTimesheet);
router.put("/:id", timesheet_controller_1.updateTimesheet);
exports.default = router;
