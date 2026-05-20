"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organization_controller_1 = require("../controllers/organization.controller");
const department_controller_1 = require("../controllers/department.controller");
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const router = express_1.default.Router();
router.use(verifyAppToken_1.verifyAppToken);
router.get("/overview", organization_controller_1.getOrganizationOverview);
router.post("/create", organization_controller_1.createOrganization);
router.post("/select", organization_controller_1.selectOrganization);
router.post("/departments", department_controller_1.createDepartment);
router.put("/departments/:id", department_controller_1.updateDepartment);
router.delete("/departments/:id", department_controller_1.deleteDepartment);
exports.default = router;
