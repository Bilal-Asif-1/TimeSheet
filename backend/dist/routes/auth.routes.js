"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const verifyAppToken_1 = require("../middleware/verifyAppToken");
const verifyMicrosoftToken_1 = require("../middleware/verifyMicrosoftToken");
const router = express_1.default.Router();
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/join-organization", verifyAppToken_1.verifyAppToken, auth_controller_1.joinOrganization);
router.post("/microsoft/sync", verifyMicrosoftToken_1.verifyMicrosoftToken, auth_controller_1.microsoftSync);
exports.default = router;
