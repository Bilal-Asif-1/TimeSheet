import express from "express";
import {
  createOrganization,
  getOrganizationOverview,
  selectOrganization,
} from "../controllers/organization.controller";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "../controllers/department.controller";
import { verifyAppToken } from "../middleware/verifyAppToken";

const router = express.Router();

router.use(verifyAppToken);
router.get("/overview", getOrganizationOverview);
router.post("/create", createOrganization);
router.post("/select", selectOrganization);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

export default router;
