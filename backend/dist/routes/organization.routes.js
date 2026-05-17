"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organization_controller_1 = require("../controllers/organization.controller");
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const router = express_1.default.Router();
router.use(verifyAppToken_1.verifyAppToken);
router.get("/overview", organization_controller_1.getOrganizationOverview);
router.post("/departments", organization_controller_1.createDepartment);
exports.default = router;
