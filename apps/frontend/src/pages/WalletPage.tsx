import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function WalletPage() {
  const { data } = useQuery({
    queryKey: ['me-wallet'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });
  const wallet = data?.wallet;
  const fmt = (n: number) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-green-900 mb-6">💰 Dompet Saya</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Utama: Saldo */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="card overflow-hidden bg-gradient-to-br from-green-800 to-green-600 text-white border-none p-6 shadow-lg relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-2">Saldo Tersedia</div>
            <div className="text-4xl font-extrabold mb-5">{fmt(wallet?.balance)}</div>
            <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all border border-white/20 backdrop-blur-sm">
              Tarik Dana →
            </button>
          </div>
        </motion.div>

        {/* Info Secondary */}
        <div className="grid grid-rows-2 gap-3">
          <div className="card p-5 flex flex-col justify-center border-amber-100 bg-amber-50/30">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">⏳ Pending Escrow</div>
            <div className="text-2xl font-bold text-amber-600">{fmt(wallet?.pending_balance)}</div>
          </div>
          
          <div className="card p-5 flex flex-col justify-center border-green-100 bg-green-50/30">
            <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">📊 Total Pemasukan</div>
            <div className="text-2xl font-bold text-green-700">{fmt(wallet?.total_earned)}</div>
          </div>
        </div>
      </div>

      <div className="card p-8 text-center bg-white border-green-100/50">
        <h2 className="font-bold text-green-900 mb-6 text-left">📋 Riwayat Transaksi</h2>
        <div className="py-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-4 grayscale opacity-50">
            📄
          </div>
          <p className="text-sm text-green-700/60 font-medium">Belum ada riwayat transaksi.</p>
          <p className="text-[11px] text-green-500 mt-1">Transaksi akan muncul otomatis setelah pesanan selesai.</p>
        </div>
      </div>
    </div>
  );
}
