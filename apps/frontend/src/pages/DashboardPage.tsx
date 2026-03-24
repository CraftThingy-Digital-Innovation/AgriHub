import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

function StatCard({ icon, label, value, change, up }: { icon: string; label: string; value: string; change?: string; up?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {change && <span className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>{change}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const [isConnecting, setIsConnecting] = useState(false);
  const isPuterConnected = !!user?.puter_token;

  // Hubungkan ke Puter API (Duplikat logic dari ChatPage agar mandiri)
  async function connectPuter() {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      // @ts-ignore
      const puter = window.puter;
      if (!puter) { 
        alert('Puter.js belum dimuat. Mohon tunggu sebentar atau muat ulang halaman.'); 
        setIsConnecting(false);
        return; 
      }

      // Check if already signed in to avoid popup
      const alreadySignedIn = await puter.auth.isSignedIn();
      if (!alreadySignedIn) {
          try {
              await puter.auth.signIn();
          } catch (signInErr: any) {
              // Jika user sengaja menutup window, jangan anggap error fatal
              if (signInErr?.error === 'auth_window_closed') {
                  console.warn('Puter Auth: User closed the window.');
                  setIsConnecting(false);
                  return;
              }
              throw signInErr;
          }
      }

      const token = puter.auth.getToken();
      if (token) {
        await api.patch('/auth/puter-token', { token });
        updateUser({ puter_token: token as string });
      } else {
          throw new Error('Gagal mendapatkan token dari Puter');
      }
    } catch (err) {
      console.error('Failed to connect Puter:', err);
      alert('Gagal menghubungkan ke Puter AI. Pastikan pop-up diizinkan dan Anda sudah login ke Puter.com');
    } finally {
        setIsConnecting(false);
    }
  }

  // Trigger otomatis jika dari WhatsApp
  if (searchParams.get('action') === 'connect-puter' && !isPuterConnected) {
    // Jalankan setelah render pertama selesai
     setTimeout(() => connectPuter(), 500);
  }

  // Tautkan WhatsApp LID otomatis
  const waLidToLink = searchParams.get('lid');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'linking' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (searchParams.get('action') === 'link' && waLidToLink && linkStatus === 'idle') {
      setLinkStatus('linking');
      api.patch('/auth/link-whatsapp', { lid: waLidToLink })
        .then(() => {
          setLinkStatus('success');
          updateUser({ whatsapp_lid: waLidToLink });
        })
        .catch(() => setLinkStatus('error'));
    }
  }, [searchParams, waLidToLink, linkStatus, updateUser]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data.wallet),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders-summary'],
    queryFn: () => api.get('/orders').then(r => r.data),
  });

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 11 ? 'Selamat Pagi' : greetingHour < 15 ? 'Selamat Siang' : greetingHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  const formatRp = (n: number) => `Rp${n?.toLocaleString('id-ID') ?? '0'}`;

  return (
    <div className="max-w-5xl mx-auto relative">
      <AnimatePresence>
        {/* Notifikasi Sukses Link WhatsApp */}
        {linkStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-[1001] bg-white border border-green-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl shrink-0">✅</div>
            <div>
              <div className="font-bold text-green-900 text-sm">WhatsApp Tertaut!</div>
              <div className="text-[10px] text-green-600 mb-2">Akun Anda berhasil dihubungkan ke WhatsApp. Silakan kembali ke chat.</div>
              <a 
                href="https://wa.me/6285188000139" 
                className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
              >
                📱 Kembali ke WhatsApp
              </a>
            </div>
            <button onClick={() => setLinkStatus('idle')} className="text-green-300 hover:text-green-500 ml-2">✕</button>
          </motion.div>
        )}

        {!isPuterConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] backdrop-blur-md bg-green-900/40 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card max-w-sm w-full p-8 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl animate-bounce">🔌</div>
              <h2 className="text-2xl font-bold text-green-900 mb-3">Konfigurasi AI</h2>
              <p className="text-green-700 text-sm mb-8">
                Untuk keamanan data Anda, silakan hubungkan AgriHub ke layanan **Puter.js** sebelum mengakses Dashboard.
              </p>
              
              <button 
                onClick={connectPuter}
                disabled={isConnecting}
                className="btn-primary w-full justify-center py-4 text-lg shadow-lg hover:scale-105 active:scale-95 transition-all mb-4 disabled:opacity-50"
              >
                {isConnecting ? (
                    <motion.span 
                        animate={{ opacity: [1, 0.5, 1] }} 
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        ⌛ Menghubungkan...
                    </motion.span>
                ) : '🚀 Hubungkan Sekarang'}
              </button>

              <div className="flex flex-col gap-2">
                <a 
                  href="https://wa.me/6285188000139" 
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  ← Ke WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-green-600 text-sm mt-1">Berikut ringkasan aktivitas platform AgriHub Anda.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="💰" label="Saldo Dompet" value={formatRp(wallet?.balance ?? 0)} />
        <StatCard icon="⏳" label="Pending Escrow" value={formatRp(wallet?.pending_balance ?? 0)} />
        <StatCard icon="📦" label="Total Pesanan" value={String(ordersData?.data?.length ?? 0)} change="↑ hari ini" up />
        <StatCard icon="💳" label="Total Pemasukan" value={formatRp(wallet?.total_earned ?? 0)} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="font-bold text-green-900 mb-4">⚡ Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🛒', label: 'Pasar', to: '/app/marketplace' },
              { icon: '📈', label: 'Harga Pangan', to: '/app/harga' },
            ].map(a => (
              <a key={a.label} href={a.to} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors cursor-pointer text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-semibold text-green-800">{a.label}</span>
              </a>
            ))}
          </div>

          {/* 2.5x Taller AI Chat Preview Card */}
          <a href="/app/chat" className="mt-4 block group">
            <div className="card bg-gradient-to-br from-green-600 to-green-500 p-6 min-h-[200px] flex flex-col justify-between hover:shadow-xl transition-all border-none overflow-hidden relative">
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div>
                <div className="flex items-center gap-2 text-white/90 mb-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-bold text-lg">Asisten AI Tani</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Konsultasikan masalah hama, harga komoditas, atau teknik tanam langsung di sini. AI AgriHub siap membantu 24/7.
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg backdrop-blur-sm">RAG & Knowledge Base Aktif</span>
                <span className="text-white font-bold text-sm bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/30 transition-colors">Tanya AI Sekarang →</span>
              </div>
            </div>
          </a>
        </div>

        <div className="card">
          <h2 className="font-bold text-green-900 mb-4">📋 4 Pilar Platform</h2>
          <div className="space-y-3">
            {[
              { icon: '🛒', color: 'bg-green-100 text-green-800', label: 'Marketplace', desc: 'Jual beli langsung petani-konsumen' },
              { icon: '🔗', color: 'bg-amber-100 text-amber-800', label: 'Matching Stok', desc: 'Supply-demand antarwilayah' },
              { icon: '📈', color: 'bg-sky-100 text-sky-800', label: 'Monitor Harga', desc: 'Pantau inflasi pangan nasional' },
              { icon: '🚚', color: 'bg-purple-100 text-purple-800', label: 'Logistik', desc: 'Biteship multi-kurir' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-sm flex-shrink-0`}>{p.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-green-900">{p.label}</div>
                  <div className="text-xs text-green-600">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
