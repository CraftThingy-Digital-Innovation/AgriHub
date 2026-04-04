import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../assets/agrihub-logo.png';
import {
  ShoppingCart,
  Link2,
  BarChart3,
  Truck,
  MessageCircle,
  Rocket,
  ArrowRight
} from "lucide-react";

const pillars = [
  {
    icon: <ShoppingCart size={28} />,
    color: 'from-green-600 to-green-400',
    title: 'Marketplace Petani–Konsumen',
    desc: 'Jual beli langsung tanpa perantara. Daftar toko, kelola stok, dan terima pesanan — sepenuhnya via WhatsApp.'
  },
  {
    icon: <Link2 size={28} />,
    color: 'from-amber-500 to-amber-400',
    title: 'Matching Demand-Supply',
    desc: 'Algoritma pencocokan surplus stok satu wilayah dengan kebutuhan wilayah lain dalam radius 200km.'
  },
  {
    icon: <BarChart3 size={28} />,
    color: 'from-sky-500 to-sky-400',
    title: 'Pemantauan Inflasi Pangan',
    desc: 'Dashboard harga pangan nasional real-time, prediksi AI 2 minggu ke depan, dan alert harga otomatis.'
  },
  {
    icon: <Truck size={28} />,
    color: 'from-purple-600 to-purple-400',
    title: 'Logistik Cerdas',
    desc: 'Cek ongkir multi-kurir via Biteship API, booking pickup, dan tracking resi — via WhatsApp.'
  },
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

  {/* HEADER */}
<header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-green-100">
  <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {/* GANTI DIV EMOJI DI BAWAH INI DENGAN LOGO */}
      <div className="w-10 h-10 flex items-center justify-center">
        <img src={logo} alt="agrihub-logo.png" className="w-full h-full object-contain" />
      </div>
      <span className="font-bold text-green-900 text-lg">AgriHub</span>
      <span className="badge badge-green text-[10px]">Indonesia</span>
    </div>
    <div className="flex items-center gap-3">
      <Link to="/login" className="btn-secondary text-sm py-2 px-4">Masuk</Link>
      <Link to="/login" className="btn-primary text-sm py-2 px-4">Mulai Gratis →</Link>
    </div>
  </div>
</header>

      {/* HERO */}
      {/* Hero */}
<section className="hero-gradient pt-32 pb-20 px-6 relative overflow-hidden">

{/* BACKGROUND GRADIENT */}
<div
  className="absolute inset-0 z-0"
  style={{
    backgroundImage:
      'radial-gradient(circle at 20% 80%, rgba(63,184,104,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,194,66,0.15) 0%, transparent 40%)',
  }}
/>

{/* 🫧 PREMIUM BUBBLE */}
<div className="absolute inset-0 z-0 pointer-events-none">

  {/* kiri bawah */}
  <motion.div
    className="absolute w-32 h-32 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"
    animate={{ y: [0, -60, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    style={{ left: "5%", bottom: "10%" }}
  >
    <div className="absolute top-4 left-6 w-6 h-6 bg-white/40 rounded-full blur-sm" />
  </motion.div>

  {/* kanan atas */}
  <motion.div
    className="absolute w-24 h-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.25)]"
    animate={{ y: [0, -40, 0], x: [0, -30, 0], scale: [1, 1.15, 1] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    style={{ right: "10%", top: "30%" }}
  >
    <div className="absolute top-3 left-4 w-4 h-4 bg-white/40 rounded-full blur-sm" />
  </motion.div>

  {/* kanan bawah */}
  <motion.div
    className="absolute w-40 h-40 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[inset_0_0_30px_rgba(255,255,255,0.2)]"
    animate={{ y: [0, -70, 0], x: [0, 40, 0], scale: [1, 1.2, 1] }}
    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    style={{ right: "5%", bottom: "5%" }}
  >
    <div className="absolute top-6 left-8 w-6 h-6 bg-white/30 rounded-full blur-sm" />
  </motion.div>

  {/* bubble kecil */}
  <motion.div
    className="absolute w-10 h-10 rounded-full bg-white/20 blur-md"
    animate={{ y: [0, -30, 0] }}
    transition={{ duration: 5, repeat: Infinity }}
    style={{ left: "30%", bottom: "15%" }}
  />

  <motion.div
    className="absolute w-6 h-6 rounded-full bg-white/30 blur-sm"
    animate={{ y: [0, -20, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
    style={{ right: "25%", bottom: "20%" }}
  />

</div>

{/* CONTENT */}
<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="max-w-4xl mx-auto relative z-10"
>

  {/* Badge */}
  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
      🌾 Platform Ketahanan Pangan AI
    </span>
  </div>

  {/* Title */}
  <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-5">
    Digitalisasi<br />
    <span className="text-amber-400">Ketahanan Pangan</span><br />
    Indonesia
  </h1>

  {/* Description */}
  <p className="text-white/75 text-lg max-w-xl mb-10 leading-relaxed">
    Platform AI yang menghubungkan petani langsung ke konsumen — marketplace,
    matching supply-demand, pemantauan inflasi, dan logistik cerdas via WhatsApp.
  </p>

  {/* Stats */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
  {stats.map((s) => (
    <div
      key={s.label}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-center transition duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
    >
      <div className="text-2xl md:text-3xl font-extrabold text-amber-400">
        {s.num}
      </div>
      <div className="text-xs md:text-sm text-white/70 uppercase tracking-wider mt-2">
        {s.label}
      </div>
    </div>
  ))}
</div>

  {/* Buttons */}
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">

{/* PRIMARY BUTTON */}
<Link
  to="/login"
  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl 
  bg-gradient-to-r from-green-600 to-green-500 
  text-white font-semibold 
  shadow-lg shadow-green-500/30
  hover:shadow-xl hover:shadow-green-400/40 
  hover:scale-105 active:scale-95 
  transition duration-300 group"
>
  <Rocket 
    size={18} 
    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
  />
  Mulai Sekarang
</Link>

{/* SECONDARY BUTTON */}
<a
  href="#pillars"
  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl 
  bg-white/10 backdrop-blur 
  border border-white/20 
  text-white font-medium 
  hover:bg-white/20 
  hover:scale-105 active:scale-95 
  transition duration-300 group"
>
  Pelajari Lebih
  <ArrowRight 
    size={18} 
    className="transition-transform group-hover:translate-x-1"
  />
</a>

</div>

        </motion.div>
      </section>

      {/* PILLARS */}
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
                transition={{ delay: i * 0.1 }}
                className="card card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-md mb-4`}>
                  <div className="transition transform hover:scale-110 hover:rotate-6 duration-300">
                    {p.icon}
                  </div>
                </div>
                <h3 className="font-bold text-green-900 mb-2">{p.title}</h3>
                <p className="text-sm text-green-700">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <div className="max-w-5xl mx-auto text-center">

          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-[#25D366] shadow-lg animate-pulse">
            <MessageCircle size={32} />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">WhatsApp-First Platform</h2>

          <p className="text-white/80 mb-10 max-w-2xl mx-auto">
            Semua fitur tersedia via WhatsApp — petani bisa daftar toko, update stok,
            terima pesanan, cek ongkir, dan pantau harga tanpa perlu buka website.
          </p>

        </div>
      </section>

      {/* CTA - COMPACT & KECE VERSION */}
      <section className="py-16 md:py-20 px-6 relative overflow-hidden bg-white">
        
        {/* Background Glow Halus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-50 rounded-full blur-[80px] -z-10 opacity-50" />

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* SISI KIRI: TEXT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-left"
          >
            {/* Judul Langsung (Tanpa Badge) */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-green-950 mb-6 leading-tight tracking-tight">
              Hasil Panen Maksimal, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-400">
                Jualan Gak Pake Ribet.
              </span>
            </h2>

            <p className="text-gray-500 text-base md:text-lg mb-8 max-w-md leading-relaxed font-medium">
              AgriHub nemenin langkah kamu. Cukup lewat WhatsApp, jualan lancar, untung pun makin tenang.
            </p>

            {/* Checklist Benefit Rapat */}
            <div className="flex flex-col gap-3 mb-10">
              <div className="flex items-center gap-2 text-green-800 font-bold text-xs uppercase tracking-wider">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]">✓</div>
                Admin Cuma 2%
              </div>
              <div className="flex items-center gap-2 text-green-800 font-bold text-xs uppercase tracking-wider">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]">✓</div>
                Tanpa Biaya Daftar
              </div>
            </div>

            {/* TOMBOL KECE (GLOSSY & ANIMATED) */}
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full 
              bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 
              text-white font-black text-lg shadow-[0_15px_30px_-10px_rgba(34,197,94,0.4)]
              hover:shadow-[0_20px_40px_-12px_rgba(34,197,94,0.6)] 
              hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
            >
              {/* Efek Kilatan Cahaya (Shine) saat Hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              
              <span>Yuk, Mulai Sekarang!</span>
              
              {/* Icon Panah yang Bergerak */}
              <div className="relative flex items-center justify-center w-6 h-6 bg-white/20 rounded-full transition-transform duration-300 group-hover:translate-x-2 group-hover:bg-white/30">
                <ArrowRight size={16} strokeWidth={3} />
              </div>
            </Link>
          </motion.div>

          {/* SISI KANAN: VISUAL LOGO CARD (COMPACT SIZE) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-56 h-56 md:w-72 md:h-72 bg-gradient-to-br from-green-600 to-emerald-500 rounded-[2.5rem] shadow-2xl flex items-center justify-center p-10 rotate-3 hover:rotate-0 transition-transform duration-500 group">
              <img 
                src={logo} 
                alt="Agrihub Logo" 
                className="w-full h-full object-contain brightness-0 invert transition-transform duration-500 group-hover:scale-110" 
              />
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -left-4 bg-white p-3 rounded-2xl shadow-lg text-green-500 border border-green-50"
              >
                <MessageCircle size={28} />
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-3 -right-4 bg-white px-5 py-2 rounded-2xl shadow-lg border border-green-50 text-center"
              >
                <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Mudah Banget</div>
                <div className="text-lg font-black text-green-600 italic">Pake WA!</div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>
      {/* FOOTER */}
      <footer className="bg-gradient-to-br from-green-950 to-green-900 text-white/60 py-10">
  <div className="max-w-6xl mx-auto text-center">

    <h3 className="text-white font-semibold mb-2">
      AgriHub Indonesia
    </h3>

    <p className="text-sm mb-4">
      Platform Digitalisasi Ketahanan Pangan
    </p>

    <div className="text-xs text-white/40">
      © 2025 — All rights reserved
    </div>

  </div>
</footer>

    </div>
  );
}