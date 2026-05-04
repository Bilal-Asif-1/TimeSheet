"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMicrosoftToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const auth_1 = require("../config/auth");
const client = (0, jwks_rsa_1.default)({
    // "common" lets us validate tokens from any Microsoft tenant/account type.
    jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
});
// Reads signing key from Microsoft public keys endpoint.
const getKey = (header, callback) => {
    if (!header.kid) {
        callback(new Error("Token header does not contain kid"));
        return;
    }
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
};
// Middleware to protect routes with Microsoft access token
const verifyMicrosoftToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    if (!token) {
        return res.status(401).json({ error: "Missing Bearer token." });
    }
    jsonwebtoken_1.default.verify(token, getKey, {
        algorithms: ["RS256"],
        audience: auth_1.authConfig.clientId,
    }, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token." });
        }
        // Attach decoded user info for next handlers.
        req.user =
            decoded;
        return next();
    });
};
exports.verifyMicrosoftToken = verifyMicrosoftToken;
