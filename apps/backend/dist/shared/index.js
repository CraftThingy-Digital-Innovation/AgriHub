"use strict";
// ─── Shared Types & Constants for AgriHub Indonesia ───────────────────────
// File ini sebagai canonical source of truth untuk semua types.
// Frontend mengaksesnya via vite path alias @agrihub/shared → ../../backend/src/shared
// Backend mengaksesnya via tsconfig path alias @agrihub/shared → ./shared
Object.defineProperty(exports, "__esModule", { value: true });
exports.WA_COMMANDS = exports.MATCH_DEFAULT_DATE_DAYS = exports.MATCH_DEFAULT_PRICE_PCT = exports.MATCH_DEFAULT_RADIUS_KM = exports.WITHDRAWAL_FEE = exports.WITHDRAWAL_MIN = exports.ESCROW_AUTO_RELEASE_DAYS = exports.MIDTRANS_MDR_RATE = exports.PPN_RATE = exports.PLATFORM_FEE_RATE = void 0;
exports.calculateFees = calculateFees;
// ── Constants ──────────────────────────────────────────────────────────────
exports.PLATFORM_FEE_RATE = 0.02; // 2%
exports.PPN_RATE = 0.11; // 11% dari platform fee
exports.MIDTRANS_MDR_RATE = 0.007; // ~0.7%
exports.ESCROW_AUTO_RELEASE_DAYS = 3;
exports.WITHDRAWAL_MIN = 50000; // Rp 50.000
exports.WITHDRAWAL_FEE = 2500; // Rp 2.500
exports.MATCH_DEFAULT_RADIUS_KM = 200;
exports.MATCH_DEFAULT_PRICE_PCT = 20;
exports.MATCH_DEFAULT_DATE_DAYS = 7;
exports.WA_COMMANDS = {
    DAFTAR_TOKO: 'DAFTAR TOKO',
    JUAL: 'JUAL',
    STOK: 'STOK',
    CARI: 'CARI',
    PESANAN: 'PESANAN',
    KONFIRMASI: 'KONFIRMASI',
    TERIMA: 'TERIMA',
    SALDO: 'SALDO',
    TARIK: 'TARIK',
    BUTUH: 'BUTUH',
    CEK: 'CEK',
    ALERT: 'ALERT',
    ONGKIR: 'ONGKIR',
    KIRIM: 'KIRIM',
    CEK_RESI: 'CEK RESI',
    MENU: 'MENU',
};
/**
 * Hitung fee breakdown untuk suatu transaksi
 */
function calculateFees(totalAmount) {
    const platformFee = Math.round(totalAmount * exports.PLATFORM_FEE_RATE);
    const ppnAmount = Math.round(platformFee * exports.PPN_RATE);
    const midtransMdr = Math.round(totalAmount * exports.MIDTRANS_MDR_RATE);
    const sellerAmount = totalAmount - platformFee - ppnAmount;
    const platformRevenue = platformFee - ppnAmount;
    return { platformFee, ppnAmount, midtransMdr, sellerAmount, platformRevenue };
}
//# sourceMappingURL=index.js.map