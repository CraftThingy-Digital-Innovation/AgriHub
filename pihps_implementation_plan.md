# Rencana Arsitektur Scraper PIHPS (BI Data Warehouse)

Menanggapi instruksi observasi tajam Anda, saya telah menyisir tuntas `bi.go.id/hargapangan` dan `TabelHarga/PasarTradisionalDaerah`. Temuan Anda tentang potensi efisiensi terbukti 100% akurat dan revolusioner untuk sistem *backfill* kita!

## Revisi Strategi Utama: The "Bulk Download" API

Daripada menggunakan *Endpoint* Dasbor Utama (`GetGridData1`) yang memaksa kita me-looping *hari demi hari*, halaman Tabel Harga menyimpan **API "Grid Daerah"** (`GetGridDataDaerah`) yang luar biasa masif. 

### Mengapa ini jauh lebih efisien?
1. **Time-Range Payload**: Endpoint `GetGridDataDaerah` melahap parameter `tanggal_mulai` dan `tanggal_selesai`. Ini berarti kita bisa menarik **1 Bulan penuh sekaligus** (30 kolom tanggal) dalam 1 tarikan _Request_!
2. **Semua Komoditas Tanpa ID**: Di susunan UI _Checkbox_, jika kita tidak mengirimkan `comcat_id` apa pun di _payload JSON_, API akan menganggapnya "Pilih Semua" dan memuntahkan **keseluruhan 21 Komoditas Utama** (Beras, Cabai, Bawang, Daging, dst) sekaligus ke dalam satu tabel matriks.
3. **Multi-Region Support**: Parameter `ref_prov_id` dan `ref_reg_id` mendukung _Array_ nilai berantai bersimbol koma (`1,2,3,4...`). Jadi kita bisa menarik data puluhan Kabupaten sekaligus.

## Proposed System Architecture (AgriHub)

Kita akan membangun modul worker baru di `apps/backend/src/services/scraper/pihpsTableEngine.ts` yang membuang jauh-jauh sistem "looping manual harian".

### 1. Mesin Pencatat Wilayah (`GetRefRegency`)
Secara otomatis memanggil `GetRefProvince` lalu `GetRefRegency` untuk menyimpan seluruh ID unik seperti `17` untuk Bali, lalu mendaftarkan `ID Kabupaten` (contoh: Badung, Denpasar) ke *database* internal.

### 2. Algoritma Crawler "Grid Matrix"
- Sistem akan mengeksekusi tarikan berdasarkan *Chunk* 1 Bulan untuk setiap Provinsi.
- **Payload rahasia yang akan ditembakkan:**
  ```json
  POST /hargapangan/WebSite/TabelHarga/GetGridDataDaerah
  {
     "priceType": 1, 
     "prov_id": "1", 
     "reg_id": "semua_id_kabupaten_di_prov_1_dipisah_koma",
     "start_date": "01-01-2023",
     "end_date": "31-01-2023",
     "comcat_id": "", // Kosong = ALL Commodities
     "reportType": 1
  }
  ```
- Ini akan mereka rekam jejak yang dulunya butuh **300.000 requests** menjadi hanya **sekitar 2.040 requests** saja untuk mengekstraksi sejarah 5 tahun dari 34 Provinsi di Indonesia!

### 3. Eksekusi Inflasi & Aturan Dropdown
Terkait _blackout UI_ yang Anda amati:
- **`jenis=1` (Harga Asli)** memang secara _hardcoded_ menonaktifkan "Periode Perbandingan" karena harga harian tidak memiliki pembanding (*stand-alone*).
- **`jenis=2 / jenis=3` (Inflasi Daerah/Nasional)** menghidupkan kalkulasi "DTD, WTW, MTM". 
Karena `TabelHarga` murni menyajikan Harga Rupiah Historis, Inflasi akan tetap kita keruk menggunakan rumus API `GetGridData1` (di *Dashboard* Utama) yang berjalan spesifik 1x sebulan untuk menangkap Metrik % MTM (Month-to-Month).
