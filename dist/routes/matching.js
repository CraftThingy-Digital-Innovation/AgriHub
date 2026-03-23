"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const knex_1 = __importDefault(require("../config/knex"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── POST /api/matching/supply — Lapor surplus stok ──────────────────────
router.post('/supply', auth_1.requireAuth, async (req, res) => {
    try {
        const { komoditas_id, quantity_kg, price_per_kg, available_from, available_until, kabupaten, provinsi, latitude, longitude } = req.body;
        if (!komoditas_id || !quantity_kg || !price_per_kg || !kabupaten) {
            res.status(400).json({ success: false, error: 'komoditas_id, quantity_kg, price_per_kg, kabupaten wajib' });
            return;
        }
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await (0, knex_1.default)('supply_reports').insert({
            id, user_id: req.user.id, komoditas_id,
            quantity_kg: Number(quantity_kg), price_per_kg: Number(price_per_kg),
            available_from: available_from || now, available_until: available_until || null,
            kabupaten, provinsi: provinsi || '', latitude: latitude || null, longitude: longitude || null,
            is_matched: false, created_at: now, updated_at: now,
        });
        // Auto-run matching
        const matches = await runMatchingFor(id, 'supply');
        res.status(201).json({ success: true, data: { id, matches_found: matches.length } });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ─── POST /api/matching/demand — Lapor kebutuhan ─────────────────────────
router.post('/demand', auth_1.requireAuth, async (req, res) => {
    try {
        const { komoditas_id, quantity_kg, max_price_per_kg, needed_by, kabupaten, provinsi } = req.body;
        if (!komoditas_id || !quantity_kg || !max_price_per_kg || !kabupaten) {
            res.status(400).json({ success: false, error: 'komoditas_id, quantity_kg, max_price_per_kg, kabupaten wajib' });
            return;
        }
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await (0, knex_1.default)('demand_requests').insert({
            id, user_id: req.user.id, komoditas_id,
            quantity_kg: Number(quantity_kg), max_price_per_kg: Number(max_price_per_kg),
            needed_by: needed_by || null, kabupaten, provinsi: provinsi || '',
            is_matched: false, created_at: now, updated_at: now,
        });
        const matches = await runMatchingFor(id, 'demand');
        res.status(201).json({ success: true, data: { id, matches_found: matches.length } });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ─── Matching Algorithm ───────────────────────────────────────────────────
// Kriteria: komoditas sama, harga supply <= max_price demand, dalam 200km (est)
async function runMatchingFor(reportId, type) {
    const matches = [];
    if (type === 'supply') {
        const supply = await (0, knex_1.default)('supply_reports').where({ id: reportId }).first();
        if (!supply)
            return matches;
        const demands = await (0, knex_1.default)('demand_requests')
            .where({ komoditas_id: supply.komoditas_id, is_matched: false })
            .where('max_price_per_kg', '>=', supply.price_per_kg);
        for (const demand of demands) {
            const score = calculateMatchScore(supply, demand);
            if (score >= 60) {
                const matchId = (0, uuid_1.v4)();
                const now = new Date().toISOString();
                await (0, knex_1.default)('match_history').insert({
                    id: matchId, supply_id: supply.id, demand_id: demand.id,
                    komoditas_id: supply.komoditas_id,
                    quantity_matched: Math.min(supply.quantity_kg, demand.quantity_kg),
                    suggested_price: Math.round((supply.price_per_kg + demand.max_price_per_kg) / 2),
                    match_score: score, status: 'suggested',
                    created_at: now,
                });
                matches.push({ supply_id: supply.id, demand_id: demand.id, score });
            }
        }
    }
    return matches;
}
function calculateMatchScore(supply, demand) {
    let score = 50; // Base score
    // Harga cocok (lebih murah = lebih bagus)
    const priceRatio = Number(supply.price_per_kg) / Number(demand.max_price_per_kg);
    if (priceRatio <= 0.8)
        score += 30;
    else if (priceRatio <= 0.9)
        score += 20;
    else if (priceRatio <= 1.0)
        score += 10;
    // Provinsi sama = bonus
    if (supply.provinsi === demand.provinsi)
        score += 15;
    if (supply.kabupaten === demand.kabupaten)
        score += 5;
    // Kuantitas cocok
    const qRatio = Math.min(Number(supply.quantity_kg), Number(demand.quantity_kg)) / Number(demand.quantity_kg);
    score += Math.floor(qRatio * 10);
    return Math.min(score, 100);
}
// ─── GET /api/matching/feed — List matches yang relevan ──────────────────
router.get('/feed', auth_1.requireAuth, async (req, res) => {
    try {
        const { provinsi } = req.query;
        let query = (0, knex_1.default)('match_history')
            .join('supply_reports', 'match_history.supply_id', 'supply_reports.id')
            .join('demand_requests', 'match_history.demand_id', 'demand_requests.id')
            .join('komoditas', 'match_history.komoditas_id', 'komoditas.id')
            .where('match_history.status', 'suggested')
            .orderBy('match_history.match_score', 'desc')
            .select('match_history.*', 'komoditas.nama as komoditas_nama', 'supply_reports.kabupaten as supply_kabupaten', 'supply_reports.provinsi as supply_provinsi', 'demand_requests.kabupaten as demand_kabupaten', 'demand_requests.provinsi as demand_provinsi')
            .limit(20);
        if (provinsi)
            query = query.where(function () {
                this.where('supply_reports.provinsi', provinsi).orWhere('demand_requests.provinsi', provinsi);
            });
        const feed = await query;
        res.json({ success: true, data: feed });
    }
    catch {
        res.status(500).json({ success: false, error: 'Gagal fetch feed matching' });
    }
});
// ─── GET /api/matching/my-supply ─────────────────────────────────────────
router.get('/my-supply', auth_1.requireAuth, async (req, res) => {
    try {
        const reports = await (0, knex_1.default)('supply_reports')
            .join('komoditas', 'supply_reports.komoditas_id', 'komoditas.id')
            .where('supply_reports.user_id', req.user.id)
            .select('supply_reports.*', 'komoditas.nama as komoditas_nama')
            .orderBy('supply_reports.created_at', 'desc');
        res.json({ success: true, data: reports });
    }
    catch {
        res.status(500).json({ success: false, error: 'Gagal fetch supply' });
    }
});
exports.default = router;
//# sourceMappingURL=matching.js.map