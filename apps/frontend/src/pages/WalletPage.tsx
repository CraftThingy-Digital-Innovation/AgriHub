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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-green-700 to-green-500 text-white border-none p-6">
          <div className="text-sm opacity-80 mb-2">Saldo Tersedia</div>
          <div className="text-3xl font-bold">{fmt(wallet?.balance)}</div>
          <button className="mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Tarik Dana →
          </button>
        </motion.div>
        <div className="grid grid-rows-2 gap-3">
          <div className="card p-4">
            <div className="text-xs text-green-600 mb-1">⏳ Pending Escrow</div>
            <div className="text-xl font-bold text-amber-600">{fmt(wallet?.pending_balance)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-green-600 mb-1">📊 Total Pemasukan</div>
            <div className="text-xl font-bold text-green-800">{fmt(wallet?.total_earned)}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="font-bold text-green-900 mb-4">📋 Riwayat Transaksi</h2>
        <div className="text-center py-10 text-green-500">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm">Riwayat transaksi akan muncul di sini setelah ada pesanan.</p>
        </div>
      </div>
    </div>
  );
}
