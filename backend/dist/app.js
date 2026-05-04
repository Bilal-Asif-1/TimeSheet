"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const timesheet_routes_1 = __importDefault(require("./routes/timesheet.routes"));
// This file builds the app (middlewares + routes).
// Think of this as "class setup" before school starts.
const app = (0, express_1.default)();
// Allow frontend/Postman requests from different origins.
app.use((0, cors_1.default)());
// Parse incoming JSON request body.
app.use(express_1.default.json());
// Global request logger:
// Shows every request method + URL in terminal.
app.use((req, _res, next) => {
    console.log("➡️ REQUEST:", req.method, req.url);
    next();
});
// All timesheet routes start with /timesheet
app.use("/timesheet", timesheet_routes_1.default);
exports.default = app;
