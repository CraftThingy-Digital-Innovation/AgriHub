# AgriHub: Roadmap Phase 2 & Chat Backup

## Deskripsi Permintaan Pengguna (Chat Backup)
Pengguna meminta evolusi arsitektur berskala besar pada sistem AgriHub, meliputi:
1. **Perbaikan Error 400 pada Peta** di `/app/toko` dan penyempurnaan Search Bar & tombol navigasi *My Location*.
2. **AI WhatsApp Terintegrasi & Smart Links**: User bisa mendaftarkan produk (contoh: "Tolong tambahkan 12KG cabe dari toko X") langsung dari WA. Jika toko belum eksis, bot otomatis membuatkan *Direct Link* agar user bisa mengeklik, menentukan titik lokasi peta, dan memilih untuk membuatnya sebagai Toko Utama / Cabang.
3. **Multi-Cabang & Lokasi**: Dukungan toko bercabang dimana *Seller* bisa berpindah antarcabang di UI website.
4. **Otomatisasi Supply-Demand & Penghapusan Input Manual**: *Seller* tidak perlu lagi mengisi form manual Supply Report. Setiap produk yang aktif pada **Toko / Cabang**, otomatis terindeks sebagai *Supply* yang bisa dicari oleh pembeli.
5. **WhatsApp Commerce Workflow terintegrasi Biteship & Midtrans**:
   - Pembeli bisa minta dicarikan bahan dari WA: *"Tolong carikan cabe 12KG di lokasi sekitar saya"*.
   - Bot mengecek ketersediaan (mengurutkan berdasarkan jarak gps) dan merekomendasikan suplai.
   - Pembeli memesan, Bot merequest opsi kurir terdekat dari *Biteship*.
   - Pembeli memilih kurir, Bot membuat ringkasan (*Summary*) dan *Link Pembayaran Midtrans*.
6. **Smart Group Notifications**: Seluruh riwayat transaksi (Notifikasi Suplai Ditemukan, Order Berhasil, Perlu Dikirim, Resi, Paket Dalam Perjalanan) semuanya dilacak dari konteks grup mana pesanan itu bermula. Notifikasi akan *broadcast* otomatis secara sinkronisasi dari website ke grup tempat pesanan bermula, atau langsung ke *Private Chat* pengguna terkait.

---

## Roadmap Teknis (Implementation Plan)

### Fase 1: Perbaikan Skema & Otomatisasi Suplai
- **Database `stores`**: Menambahkan kolom `parent_store_id` dan `is_main_branch`.
- **Database `orders`**: Menambahkan kolom `group_jid` untuk menampung ID Grup WhatsApp jika transaksi diawali dari grup. Menambahkan kolom `draft_shipping_data` untuk menampung cache Biteship saat user memilih opsi pengiriman.
- **Backend Matching**: Penghapusan rutinitas manual `supply_reports`. Endpoint pencarian dan *AI Tools* kini akan menarik ketersediaan suplai langsung melalui *SQL Query* `JOIN products AND stores`. 

### Fase 2: Peningkatan UI Website (Seller & Peta)
- **MapPicker.tsx**: Menambahkan HTML5 Geolocation API, serta mapping data provinsi/kabupaten yang konsisten untuk memperbaiki masalah `400 Bad Request` pada *endpoints* `POST /api/stores`. 
- **SellerPage.tsx**: Pembuatan *Store Context Switcher* untuk navigasi Multi-Cabang.
- **Deep Linking Registrasi**: Membuat halaman khusus atau menyematkan parameter (misal `?token=...&setup_store=true`) pada UI untuk menangkap navigasi dari URL Bot WhatsApp.

### Fase 3: Rombak Tools AI (WhatsApp Commerce)
Mengembangkan parameter eksekusi RAG Node.js (`aiService.ts`):
1. **`search_supply`**: Mengambil koordinat pembeli dan menampilkan barang di `products`.
2. **`check_shipping`**: Meminta API Biteship atas kurir antara koordinat Cabang Penjual ke koordinat Pembeli. 
3. **`generate_checkout`**: Membuat pesanan *Pending* di dalam sistem dan memproduksi *Midtrans Payment Link*.
4. **`register_product`**: Menangkap niat *seller*. Jika Cabang belum dikonfigurasi, bot memproduksi "Magic Link" Setup ke `agrihub.rumah-genbi.com`.

### Fase 4: Sistem Notifikasi Omnichannel Terpusat
Mengembangkan modul **Notifier**:
- Mengaitkan Midtrans Webhook (Saat `settlement` berhasil) ke fungsi Notifikasi WhatsApp yang menembak langsung ke `order.group_jid` (atau DM).
- Mengaitkan Biteship Webhook (Saat kurir *picked up*, *delivered*) agar mengirim notifikasi *live tracking* ke *WhatsApp Group*.
- Memicu notifikasi "Barang Baru dalam Radius Anda" setiap kali ada *Seller* sukses menambah komoditas baru (sinkron dengan `price_alerts` atau `demand_requests`).
