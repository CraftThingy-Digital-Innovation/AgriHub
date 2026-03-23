# AgriHub Indonesia - Task Checklist

## Phase 0: Setup & Dokumentasi
- [x] Baca PDF plan
- [x] Buat CONTEXT.md
- [x] Buat implementation_plan.md
- [x] Buat task.md
- [ ] Initialize monorepo (root package.json, workspaces)
- [ ] Git init & commit awal

## Sprint 1 (S1): Foundation (Minggu 1-2)

### Monorepo Structure
- [ ] Root `package.json` dengan npm workspaces
- [ ] `packages/server/` (Express.js)
- [ ] `packages/client/` (Vite + React)
- [ ] `packages/shared/` (shared types & utils)
- [ ] Root tsconfig, ESLint, Prettier
- [ ] `.env.example` di packages/server

### Server Foundation
- [ ] Express.js + TypeScript setup
- [ ] Knex.js config (SQLite dev / PostgreSQL prod)
- [ ] Auto-migration sistem saat startup
- [ ] Database seeds (100+ jenis tanaman)
- [ ] Puter OAuth middleware
- [ ] JWT session management
- [ ] CORS & security middleware (helmet, cors)
- [ ] Route dasar: auth, users, products

### Client Foundation
- [ ] Vite + React + TypeScript
- [ ] Tailwind CSS v4 (Forest Green theme)
- [ ] Framer Motion
- [ ] Radix UI
- [ ] React Router v7
- [ ] Puter.js SDK
- [ ] Service Worker (loading progress bar)
- [ ] Halaman: Landing, Login, Dashboard, Marketplace

### Commit S1
- [ ] `chore: initialize monorepo structure`
- [ ] `feat(server): express, knex, auth foundation`
- [ ] `feat(client): vite react tailwind foundation`
- [ ] `feat: database seeds - 100+ tanaman`

## Sprint 2 (S2): RAG & AI Chat (Minggu 3-4)

### RAG Engine (Server)
- [ ] Puter.js AI SDK integration
- [ ] Document parser: PDF, DOCX, XLSX
- [ ] URL scraper knowledge base
- [ ] YouTube transcript parser
- [ ] Embedding & vector storage (SQLite)
- [ ] RAG retrieval & prompt injection

### AI Chat (Client)
- [ ] Chat interface (streaming)
- [ ] Upload dokumen ke knowledge base
- [ ] Group credit system

### Commit S2
- [ ] `feat(server): RAG engine & document parser`
- [ ] `feat(client): AI chat interface`

## Sprint 3 (S3): WhatsApp, Payments, Escrow (Minggu 5-6)

### WhatsApp Bot
- [ ] Baileys.js integration
- [ ] Perintah bot personal & grup
- [ ] Alur menu stok/toko via WhatsApp
- [ ] RAG integration di bot

### Marketplace & Payments
- [ ] CRUD produk (dengan foto)
- [ ] Keranjang belanja
- [ ] Midtrans Snap integration
- [ ] Midtrans Webhook
- [ ] Sistem Escrow (hold → release)
- [ ] Dompet Penjual
- [ ] Kalkulasi komisi & PPN
- [ ] Dashboard laporan keuangan

### Commit S3
- [ ] `feat(server): WhatsApp bot Baileys.js`
- [ ] `feat: marketplace & product CRUD`
- [ ] `feat: Midtrans payment & escrow`

## Sprint 4 (S4): Matching, Logistik, Monitoring (Minggu 7-8)

### Demand-Supply Matching
- [ ] Model data supply/demand
- [ ] Algoritma matching berbasis wilayah
- [ ] Saran harga equilibrium
- [ ] Visualisasi dashboard

### Price Monitoring
- [ ] Scraper harga pangan nasional
- [ ] Model prediksi harga sederhana
- [ ] Sistem alert inflasi
- [ ] Dashboard chart (Recharts)
- [ ] Peta distribusi (Leaflet)

### Logistik (Biteship)
- [ ] Cek ongkir multi-kurir
- [ ] Booking pengiriman
- [ ] Tracking resi
- [ ] Notifikasi WhatsApp pengiriman

### Commit S4
- [ ] `feat: demand-supply matching algorithm`
- [ ] `feat: price monitoring & scraper`
- [ ] `feat: Biteship logistics integration`

## Final
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Deployment config (Puter.com)
- [ ] Dokumentasi final
- [ ] `chore: final deployment & docs`
