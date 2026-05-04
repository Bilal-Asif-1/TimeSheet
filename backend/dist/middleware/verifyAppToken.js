"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAppToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyAppToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    if (!token) {
        return res.status(401).json({ error: "Missing app token." });
    }
    try {
        const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.appUser = decoded;
        return next();
    }
    catch (_error) {
        return res.status(403).json({ error: "Invalid or expired app token." });
    }
};
exports.verifyAppToken = verifyAppToken;
