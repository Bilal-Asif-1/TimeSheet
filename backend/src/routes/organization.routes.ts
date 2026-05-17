import express from "express";
import { createDepartment, getOrganizationOverview } from "../controllers/organization.controller";
import { verifyAppToken } from "../middleware/verifyAppToken";

const router = express.Router();

router.use(verifyAppToken);
router.get("/overview", getOrganizationOverview);
router.post("/departments", createDepartment);

export default router;
