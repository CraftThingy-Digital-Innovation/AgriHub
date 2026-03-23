import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const pillars = [
  { icon: '🛒', color: 'from-green-600 to-green-400', bg: '#f0faf2', title: 'Marketplace Petani–Konsumen', desc: 'Jual beli langsung tanpa perantara. Daftar toko, kelola stok, dan terima pesanan — sepenuhnya via WhatsApp.' },
  { icon: '🔗', color: 'from-amber-500 to-amber-400', bg: '#fffbf0', title: 'Matching Demand-Supply', desc: 'Algoritma pencocokan surplus stok satu wilayah dengan kebutuhan wilayah lain dalam radius 200km.' },
  { icon: '📈', color: 'from-sky-500 to-sky-400', bg: '#f0f8ff', title: 'Pemantauan Inflasi Pangan', desc: 'Dashboard harga pangan nasional real-time, prediksi AI 2 minggu ke depan, dan alert harga otomatis.' },
  { icon: '🚚', color: 'from-purple-600 to-purple-400', bg: '#f5f0ff', title: 'Logistik Cerdas', desc: 'Cek ongkir multi-kurir via Biteship API, booking pickup, dan tracking resi — via WhatsApp.' },
];

const stats = [
  { num: '4', label: 'Pilar Ketahanan Pangan' },
  { num: '15+', label: 'Modul Fitur' },
  { num: '100+', label: 'Komoditas Pangan' },
  { num: '$0.50', label: 'Target Budget AI/Bulan' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-green-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white">🌾</div>
            <span className="font-bold text-green-900 text-lg">AgriHub</span>
            <span className="badge badge-green text-[10px]">Indonesia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Masuk</Link>
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Mulai Gratis →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(63,184,104,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,194,66,0.15) 0%, transparent 40%)',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">🌾 Platform Ketahanan Pangan AI</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-5">
            Digitalisasi<br />
            <span className="text-amber-400">Ketahanan Pangan</span><br />
            Indonesia
          </h1>
          <p className="text-white/75 text-lg max-w-xl mb-10 leading-relaxed">
            Platform AI yang menghubungkan petani langsung ke konsumen — marketplace, matching supply-demand, pemantauan inflasi, dan logistik cerdas via WhatsApp.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mb-10">
            {stats.map(s => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-amber-400">{s.num}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to="/login" className="btn-primary text-base px-6 py-3">
              🚀 Mulai Sekarang
            </Link>
            <a href="#pillars" className="btn-secondary text-base px-6 py-3 border-white/30 text-white bg-white/10 hover:bg-white/20">
              Pelajari Lebih →
            </a>
          </div>
        </motion.div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge badge-green mb-3">4 Pilar Platform</div>
            <h2 className="text-3xl font-bold text-green-900 mb-3">Solusi Lengkap Ekosistem Pertanian</h2>
            <p className="text-green-700 max-w-xl mx-auto">Dari petani ke konsumen, semua bisa dikelola lewat WhatsApp tanpa perlu buka website.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="card card-hover"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xl mb-4`}>
                  {p.icon}
                </div>
                <h3 className="font-bold text-green-900 mb-2">{p.title}</h3>
                <p className="text-sm text-green-700 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp First */}
      <section className="py-16 px-6 bg-gradient-to-br from-green-900 to-green-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-3xl font-bold text-white mb-4">WhatsApp-First Platform</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Semua fitur tersedia via WhatsApp — petani bisa daftar toko, update stok, terima pesanan, cek ongkir, dan pantau harga tanpa pernah buka website.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-left font-mono text-sm text-white/90 max-w-md mx-auto border border-white/20">
            <div className="mb-1"><span className="text-amber-400">Petani:</span> DAFTAR TOKO</div>
            <div className="mb-1"><span className="text-green-300">Bot:</span> Kirim: Nama toko | Kabupaten | Jenis produk</div>
            <div className="mb-1"><span className="text-amber-400">Petani:</span> Tani Maju | Bengkulu | Cabai, Sayuran</div>
            <div className="mb-1"><span className="text-green-300">Bot:</span> ✅ Toko terdaftar! Kode: TM-2841</div>
            <div className="mb-1"><span className="text-amber-400">Petani:</span> JUAL Cabai Merah 45000 50</div>
            <div><span className="text-green-300">Bot:</span> ✅ Listed! Kirim foto untuk tampil di website</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-green-900 mb-4">Bergabung Sekarang</h2>
          <p className="text-green-700 mb-8">Gratis untuk petani. Komisi platform hanya 2% dari transaksi berhasil.</p>
          <Link to="/login" className="btn-primary text-base px-8 py-4">
            🌾 Mulai Gratis Sekarang →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-earth-900 text-white/50 text-center py-8 text-sm">
        <strong className="text-white/80">AgriHub Indonesia</strong> — Platform Digitalisasi Ketahanan Pangan © 2025
      </footer>
    </div>
  );
}
