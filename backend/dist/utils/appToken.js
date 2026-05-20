"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueAppToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const issueAppToken = (payload) => {
    const secret = process.env.APP_JWT_SECRET || "dev-secret-change-me";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
};
exports.issueAppToken = issueAppToken;
