import express, { Request } from "express";
import {
  microsoftLogin,
  microsoftCallback,
} from "../controllers/auth.controller";
import { verifyMicrosoftToken } from "../middleware/verifyMicrosoftToken";

const router = express.Router();

// Start Microsoft login flow
router.get("/microsoft/login", microsoftLogin);

// Microsoft redirects back to this URL
router.get("/microsoft/callback", microsoftCallback);

// Test route to verify token is valid
router.get("/me", verifyMicrosoftToken, (req, res) => {
  const user = (req as Request & { user?: unknown }).user ?? null;

  res.json({
    message: "Token is valid",
    user,
  });
});

export default router;
