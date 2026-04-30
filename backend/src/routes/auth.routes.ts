import express from "express";
import { login, microsoftSync, register } from "../controllers/auth.controller";
import { verifyMicrosoftToken } from "../middleware/verifyMicrosoftToken";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/microsoft/sync", verifyMicrosoftToken, microsoftSync);

export default router;
