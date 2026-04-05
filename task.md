# AgriHub Indonesia - Task Checklist

## Phase 0: Setup & Dokumentasi
- [x] Baca PDF plan
- [x] Buat CONTEXT.md
- [x] Buat implementation_plan.md
- [x] Buat task.md
- [x] Initialize monorepo (root package.json, workspaces)
- [x] Git init & commit awal

## Sprint 1 (S1): Foundation (Minggu 1-2)

### Monorepo Structure
- [x] Root `package.json` + npm workspaces (`apps/*`, `packages/*`)
- [x] `apps/backend/` (Express.js + Knex + SQLite)
- [x] `apps/frontend/` (Vite + React 19 + Tailwind v4)
- [x] `packages/shared/` (types, calculateFees, constants)
- [x] Root tsconfig, .gitignore, .env.example

### Server Foundation
- [x] Express.js + helmet + cors + rate-limit
- [x] Knex.js SQLite(dev) / PostgreSQL(prod) config
- [x] Auto-migration startup — 16 tabel lengkap
- [x] Seeds 102 komoditas/tanaman (6 kategori)
- [x] JWT middleware (requireAuth, requireAdmin)
- [x] Routes: auth, products(CRUD), stores, orders

### Client Foundation
- [x] Vite 5 + React 19 + TypeScript
- [x] Tailwind CSS v4 Forest Green theme
- [x] Framer Motion page transitions
- [x] React Router v6 + protected routes
- [x] Zustand auth store (persisted localStorage)
- [x] TanStack Query data fetching
- [x] Landing page (hero + 4 pilar + WA demo)
- [x] Login/Register page (glassmorphism)
- [x] Dashboard layout (sidebar + page transitions)
- [x] Dashboard, Marketplace, Seller, Orders, Wallet pages
- [x] AI Chat / Price Monitor / Matching stubs

### Commit S1
- [x] `chore: initialize AgriHub Indonesia monorepo structure`
- [x] `feat(server): Express + Knex + SQLite + JWT + seeds 100+ tanaman`

## Sprint 1.5: Enhanced Auth & Shipping (Lost History Restored)

### Auth System (from bd0c1a31)
- [x] Push root git
- [x] Migration 014: username, email_verified, phone_verified, OTP columns
- [x] Migration 015: app_settings table (SMTP config)
- [x] emailService.ts (Nodemailer, config from DB)
- [x] Upgrade auth.ts routes (register, login, login-puter, OTP endpoints)
- [x] Upgrade admin.ts (SMTP settings CRUD)
- [x] Complete LoginPage.tsx rewrite (Puter OAuth, username, email, phone OTP, password show/hide, strength)
- [x] Upgrade AdminPage.tsx (SMTP settings section)

### Marketplace Shipping (from 437e2476)
- [x] Implement real-time shipping cost in checkout modal
- [x] Integration with Biteship API (postal code based)
- [x] Update orders table with shipping_fee
- [x] Midtrans line-item for shipping fee

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
