import express from "express";
import {
  createDepartment,
  createOrganization,
  getOrganizationOverview,
  selectOrganization,
} from "../controllers/organization.controller";
import { verifyAppToken } from "../middleware/verifyAppToken";

const router = express.Router();

router.use(verifyAppToken);
router.get("/overview", getOrganizationOverview);
router.post("/create", createOrganization);
router.post("/select", selectOrganization);
router.post("/departments", createDepartment);

export default router;
