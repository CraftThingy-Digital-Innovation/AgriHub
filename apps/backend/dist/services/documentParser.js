"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdf = parsePdf;
exports.parseXlsx = parseXlsx;
exports.parseUrl = parseUrl;
exports.parseYouTube = parseYouTube;
exports.parseText = parseText;
exports.parseFile = parseFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
// ─── PDF Parser ────────────────────────────────────────────────────────────
async function parsePdf(filePath) {
    try {
        // Import dari path internal untuk avoid bug ./stubFalse di Node.js 24
        // pdf-parse default export coba require('./test/unit/mocks/pdf.js') saat top-level import
        const pdfParsePath = require.resolve('pdf-parse/lib/pdf-parse.js');
        const pdfParse = require(pdfParsePath);
        const buffer = fs_1.default.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text;
    }
    catch (err) {
        console.error('PDF parse error:', err);
        throw new Error('Gagal membaca file PDF');
    }
}
// ─── XLSX / CSV Parser ─────────────────────────────────────────────────────
async function parseXlsx(filePath) {
    try {
        const XLSX = await Promise.resolve().then(() => __importStar(require('xlsx')));
        const workbook = XLSX.readFile(filePath);
        const lines = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            lines.push(`=== Sheet: ${sheetName} ===\n${csv}`);
        }
        return lines.join('\n\n');
    }
    catch (err) {
        console.error('XLSX parse error:', err);
        throw new Error('Gagal membaca file Excel');
    }
}
// ─── URL / Web Scraper ─────────────────────────────────────────────────────
async function parseUrl(url) {
    try {
        const { data } = await axios_1.default.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 AgriHub-Bot/1.0' },
            timeout: 15000,
        });
        // Strip HTML tags dengan regex sederhana
        const text = data
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return text.slice(0, 50000); // Limit 50k char
    }
    catch (err) {
        console.error('URL scrape error:', err);
        throw new Error(`Gagal mengambil konten dari URL: ${url}`);
    }
}
// ─── YouTube Transcript ────────────────────────────────────────────────────
async function parseYouTube(videoUrl) {
    try {
        // Extract video ID
        const match = videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        if (!match)
            throw new Error('URL YouTube tidak valid');
        const videoId = match[1];
        // Ambil transcript via timedtext API (unofficial, works for auto-captions)
        const langCodes = ['id', 'en'];
        for (const lang of langCodes) {
            try {
                const { data } = await axios_1.default.get(`https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`, { timeout: 10000 });
                if (data?.events) {
                    const transcript = data.events
                        .filter((e) => e.segs)
                        .map((e) => e.segs.map((s) => s.utf8 || '').join(''))
                        .join(' ');
                    if (transcript.trim().length > 50) {
                        return `[YouTube Transcript - ${videoId}]\n\n${transcript}`;
                    }
                }
            }
            catch { /* try next lang */ }
        }
        // Fallback: scrape video page for description
        const { data: pageHtml } = await axios_1.default.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const descMatch = pageHtml.match(/"description":{"simpleText":"([^"]+)"/);
        if (descMatch)
            return `[YouTube Video Description]\n\n${descMatch[1]}`;
        throw new Error('Tidak bisa mengambil transcript YouTube');
    }
    catch (err) {
        throw new Error(`Gagal parse YouTube: ${err.message}`);
    }
}
// ─── Plain Text ────────────────────────────────────────────────────────────
function parseText(content) {
    return content.trim();
}
// ─── Auto-detect & parse by file extension ────────────────────────────────
async function parseFile(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    switch (ext) {
        case '.pdf': return parsePdf(filePath);
        case '.xlsx':
        case '.xls':
        case '.csv': return parseXlsx(filePath);
        case '.txt':
        case '.md': return parseText(fs_1.default.readFileSync(filePath, 'utf-8'));
        default: throw new Error(`Format file tidak didukung: ${ext}`);
    }
}
//# sourceMappingURL=documentParser.js.map