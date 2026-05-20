"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOrganizationAdmin = exports.getAppUser = void 0;
const getAppUser = (req) => req.appUser;
exports.getAppUser = getAppUser;
const isOrganizationAdmin = (user) => user?.role === "ceo" || user?.role === "manager";
exports.isOrganizationAdmin = isOrganizationAdmin;
