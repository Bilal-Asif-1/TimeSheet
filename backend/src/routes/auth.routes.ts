import express from "express";
import { joinOrganization, login, microsoftSync, register } from "../controllers/auth.controller";
import { verifyAppToken } from "../middleware/verifyAppToken";
import { verifyMicrosoftToken } from "../middleware/verifyMicrosoftToken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/join-organization", verifyAppToken, joinOrganization);
router.post("/microsoft/sync", verifyMicrosoftToken, microsoftSync);

export default router;
