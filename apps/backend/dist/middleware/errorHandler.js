"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
function errorHandler(err, _req, res, _next) {
    console.error('❌ Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Terjadi kesalahan server'
            : err.message,
    });
}
function notFoundHandler(_req, res) {
    res.status(404).json({ success: false, error: 'Route tidak ditemukan' });
}
//# sourceMappingURL=errorHandler.js.map