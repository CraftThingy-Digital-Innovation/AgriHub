"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const knex_1 = __importDefault(require("../config/knex"));
/**
 * Verifikasi JWT token dari header Authorization: Bearer <token>
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Token tidak ada' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await (0, knex_1.default)('users').where({ id: decoded.id }).first();
        if (!user) {
            res.status(401).json({ success: false, error: 'User tidak ditemukan' });
            return;
        }
        req.user = {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
        };
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Token tidak valid' });
    }
}
/**
 * Cek apakah user adalah admin
 */
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Akses admin diperlukan' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map