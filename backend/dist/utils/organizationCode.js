"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidOrganizationCode = exports.generateOrganizationCode = exports.normalizeOrganizationCode = void 0;
const normalizeOrganizationCode = (value) => value.trim().toUpperCase();
exports.normalizeOrganizationCode = normalizeOrganizationCode;
const generateOrganizationCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let index = 0; index < 6; index += 1) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `ORG-${suffix}`;
};
exports.generateOrganizationCode = generateOrganizationCode;
const isValidOrganizationCode = (value) => /^ORG-[A-Z0-9]{4,12}$/.test(value);
exports.isValidOrganizationCode = isValidOrganizationCode;
