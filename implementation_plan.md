# AgriHub Indonesia - Implementation Plan

## Goal
Membangun platform **AgriHub Indonesia** sebagai **monorepo** lengkap berdasarkan PDF plan. Platform ini menghubungkan petani-konsumen via marketplace, AI chatbot RAG berbasis Puter.js, WhatsApp Bot (Baileys.js), pembayaran Midtrans + escrow, pemantauan harga pangan, dan logistik Biteship.

---

## Proposed Changes

### Root Monorepo Config

#### [NEW] [package.json](file:///d:/CraftThingy/AgriHub/package.json)
Root workspace config dengan npm workspaces pointing ke `packages/*`. Scripts: `dev`, `build`, `lint`.

#### [NEW] [tsconfig.json](file:///d:/CraftThingy/AgriHub/tsconfig.json)
Root TypeScript config dengan `references` ke masing-masing package.

#### [NEW] [.gitignore](file:///d:/CraftThingy/AgriHub/.gitignore)
Node_modules, dist, .env, dev.db, .baileys.

#### [NEW] [.env.example](file:///d:/CraftThingy/AgriHub/.env.example)
Template env vars untuk server.

---

### packages/shared — Shared Types & Utils

#### [NEW] package.json, tsconfig.json
#### [NEW] src/types/index.ts
Types: `User`, `Product`, `Order`, `Wallet`, `SupplyDemand`, `PriceData`, `Message`.

#### [NEW] src/constants/index.ts
Konstanta: komisi fee, platform commission rate, escrow window.

---

### packages/server — Express.js API

#### [NEW] package.json
Dependencies: `express`, `knex`, `better-sqlite3`, `pg`, `puter`, `baileys`, `midtrans-client`, `axios`, `multer`, `helmet`, `cors`, `jsonwebtoken`, `bcryptjs`.

#### [NEW] src/index.ts
Entry point Express server dengan auto-migration.

#### [NEW] src/db/knex.ts
Knex config (SQLite dev / PostgreSQL prod).

#### [NEW] src/db/migrations/
Migration files untuk semua tabel: users, products, orders, wallets, transactions, supply_demand, price_data, rag_documents, group_credits, whatsapp_sessions.

#### [NEW] src/db/seeds/
Seed data: 100+ jenis tanaman Indonesia dengan info dasar.

#### [NEW] src/middleware/
auth.ts (Puter OAuth + JWT), errorHandler.ts, upload.ts (multer).

#### [NEW] src/routes/
- `auth.ts` — login, logout, profile (Enhanced: identifier-based login, Puter OAuth, magic links)
- `products.ts` — CRUD marketplace (Updated: includes store_postal_code)
- `orders.ts` — buat order, status (Updated: includes shipping_fee, courier, service)
- `escrow.ts` — hold, release, dispute
- `wallet.ts` — saldo, withdraw
- `rag.ts` — upload dokumen, chat AI
- `whatsapp.ts` — QR, status bot
- `supply-demand.ts` — input stok/demand, matching
- `price-monitor.ts` — data harga, prediksi
- `shipping.ts` — Biteship ongkir, booking, tracking
- `webhook.ts` — Midtrans webhook (Updated: shipping cost line-item handling)
- `wa_magic_sessions.ts` — [NEW] Handles proof-of-ownership via WA bot magic links

#### [NEW] src/services/
- `ragService.ts` — Puter.js AI + embedding + retrieval
- `documentParser.ts` — PDF, DOCX, XLSX, URL, YouTube parser  
- `whatsappBot.ts` — Baileys.js bot logic
- `midtransService.ts` — Snap + webhook handler
- `escrowService.ts` — escrow state machine
- `matchingService.ts` — supply-demand matching algorithm
- `scrapingService.ts` — harga pangan scraper
- `biteshipService.ts` — Biteship API wrapper

---

### packages/client — Vite + React SPA

#### [NEW] package.json
Dependencies: `react`, `react-dom`, `react-router-dom`, `@radix-ui/*`, `framer-motion`, `recharts`, `leaflet`, `puter`, `tailwindcss`, `axios`.

#### [NEW] vite.config.ts
Vite config + proxy ke server :3001.

#### [NEW] tailwind.config.ts
Tailwind v4 dengan Forest Green theme: 
- Primary: `#2D6A4F` (forest green)
- Accent: `#52B788`
- Background: `#F8FAF9`

#### [NEW] public/sw.js
Service Worker untuk loading progress bar saat load aset Vite.

#### [NEW] src/pages/
- `LandingPage.tsx` — Hero section, 4 pilar, fitur utama
- `LoginPage.tsx` — Puter OAuth login
- `DashboardPage.tsx` — Overview stats
- `MarketplacePage.tsx` — Browse produk petani
- `ProductDetailPage.tsx` — Detail produk + order
- `SellerDashboard.tsx` — Manajemen toko petani
- `ChatPage.tsx` — AI chatbot RAG
- `PriceMonitorPage.tsx` — Chart harga pangan + map
- `OrdersPage.tsx` — Daftar pesanan
- `WalletPage.tsx` — Saldo & transaksi
- `AdminPage.tsx` — Admin panel

#### [NEW] src/components/
- Layout: `Sidebar.tsx`, `Header.tsx`, `Footer.tsx`
- UI: `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `LoadingBar.tsx`
- Charts: `PriceChart.tsx` (Recharts), `DistributionMap.tsx` (Leaflet)
- Features: `ProductCard.tsx`, `ChatMessage.tsx`, `EscrowStatus.tsx`

---

## Verification Plan

### Sprint 1 — Foundation
```bash
# Install dependencies
cd d:\CraftThingy\AgriHub
npm install

# Start server dev
npm run dev --workspace=packages/server

# Start client dev
npm run dev --workspace=packages/client
```
Manual: Buka browser → `http://localhost:5173` (landing page muncul, green theme) → `http://localhost:3001/health` (returns `{status: "ok"}`).

### Sprint 2 — RAG
```bash
# Test RAG endpoint
curl -X POST http://localhost:3001/api/rag/chat -H "Content-Type: application/json" -d '{"message": "Apa penyakit umum tanaman padi?"}'
```

### Sprint 3 — WhatsApp & Payment
Manual: Scan QR WhatsApp → kirim pesan `/stok` → bot membalas menu stok.

Manual: Lakukan checkout produk → redirect ke Midtrans Snap → bayar sandbox → webhook fires → status order berubah ke `paid`.

### Sprint 4 — Matching & Monitoring
Manual: Buka `/price-monitor` → chart harga pangan tampil → map Leaflet tampil distribusi supply/demand.

```bash
# Test matching endpoint
curl -X GET http://localhost:3001/api/supply-demand/matches?wilayah=jawa-barat
```
