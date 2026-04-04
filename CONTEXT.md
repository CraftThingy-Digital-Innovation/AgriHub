# AgriHub Indonesia - Project Context

## Ringkasan Proyek
**AgriHub Indonesia** adalah platform digitalisasi ketahanan pangan nasional yang menghubungkan petani langsung ke konsumen melalui marketplace, AI chatbot berbasis RAG, WhatsApp Bot, sistem pembayaran escrow, pemantauan inflasi harga pangan, dan logistik cerdas.

## Visi & Misi
- **Visi:** Menciptakan ekosistem pertanian digital yang adil, transparan, dan efisien di Indonesia.
- **Misi:** Menghapus rantai perantara antara petani dan konsumen melalui teknologi murah dan mudah diakses (WhatsApp-first).

## 4 Pilar Utama
1. **Marketplace Petani-Konsumen:** Jual beli langsung, stok & toko bisa dikelola via WhatsApp.
2. **Matching Demand-Supply:** Algoritma mempertemukan surplus stok satu wilayah dengan defisit wilayah lain.
3. **Pemantauan Inflasi Pangan:** Scraper harga bahan pangan nasional + prediksi harga + alert dini.
4. **Logistik Cerdas:** Integrasi Biteship untuk cek ongkir, booking, dan tracking via WhatsApp.

## Target Pengguna
- **Petani:** Mendaftarkan toko, mengelola stok, menerima pesanan via WhatsApp.
- **Konsumen:** Membeli produk segar langsung dari petani.
- **Admin:** Monitoring platform, keuangan, laporan.
- **Grup WhatsApp:** Pemilik grup bisa aktifkan AI bot dengan sistem kredit.

## Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Backend | Express.js (Node.js) |
| Frontend | Vite + React (SPA) |
| Database | SQLite (dev) / PostgreSQL (prod) via Knex.js |
| AI | Puter.js SDK + RAG Engine |
| WhatsApp | Baileys.js |
| Pembayaran | Midtrans (Snap + Webhook) |
| Logistik | Biteship API |
| Styling | Tailwind CSS v4 |
| Animasi | Framer Motion |
| UI Components | Radix UI |
| Charts | Recharts |
| Maps | Leaflet.js |
| Auth | Puter OAuth |
| Deployment | Puter.com |

## Struktur Monorepo
```
AgriHub/
├── packages/
│   ├── server/          # Express.js API server
│   ├── client/          # Vite + React SPA
│   └── shared/          # Shared types, utils, constants
├── CONTEXT.md           # Dokumen konteks ini
├── task.md              # Checklist tugas
├── implementation_plan.md  # Rencana implementasi teknis
├── package.json         # Root workspace config
└── .gitignore
```

## Roadmap Sprint
| Sprint | Minggu | Fokus |
|--------|--------|-------|
| S1 | 1-2 | Foundation: monorepo, auth, DB, seeding |
| S2 | 3-4 | RAG System, AI Chat, Document Parser |
| S3 | 5-6 | WhatsApp Bot, Midtrans, Escrow |
| S4 | 7-8 | Matching Algorithm, Biteship, Price Monitoring |

## Sistem Keuangan & Komisi
- **Midtrans MDR:** ~0.7%
- **Platform Fee:** ~2% dari nilai transaksi
- **PPN:** 11% dari platform fee
- **Escrow:** Dana ditahan → dilepas setelah konfirmasi/3 hari otomatis

## Environment Variables (Server)
```env
PORT=3000
DATABASE_URL=./dev.db         # SQLite dev
NODE_ENV=development
PUTER_APP_ID=agrihub-indonesia
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
BITESHIP_API_KEY=...
JWT_SECRET=...
```

## Konvensi Kode
- **Bahasa:** TypeScript di seluruh proyek
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Branch:** `main` (production), `develop` (aktif development)
- **Package manager:** npm workspaces
- **Git Workflow:** 
  1. Selalu jalankan `git add .`, `git commit`, dan `git push` ke root repository di `https://github.com/CraftThingy-Digital-Innovation/AgriHub.git` setiap ada perubahan.
  2. Untuk backend deployment (setelah `build` frontend dan bundle masuk ke dalam backend), pastikan melakukan push secara otomatis (melalui script subtree/push) ke remote `https://github.com/CraftThingy-Digital-Innovation/AgriHub-backend.git`.
