import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownLeft, Clock, BarChart3, FileText } from 'lucide-react';
import api from '../lib/api';

export default function WalletPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['me-wallet'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  const wallet = data?.wallet;

  const fmt = (n: number) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-green-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-green-100 animate-pulse rounded-xl" />
          <div className="space-y-3">
            <div className="h-20 bg-green-100 animate-pulse rounded-xl" />
            <div className="h-20 bg-green-100 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-2">
        <Wallet className="text-green-600" size={22} />
        <h1 className="text-2xl font-bold text-green-900">Dompet Saya</h1>
      </div>

      <p className="text-sm text-green-600 -mt-4">
        Kelola saldo dan pantau transaksi Anda
      </p>

      {/* ================= WALLET ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* SALDO */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-green-700 to-green-500"
        >
          <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
              Saldo Tersedia
            </div>

            <div className="text-4xl font-extrabold mb-6">
              {fmt(wallet?.balance)}
            </div>

            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition border border-white/20">
              <ArrowDownLeft size={14} />
              Tarik Dana
            </button>
          </div>
        </motion.div>

        {/* INFO */}
        <div className="grid grid-rows-2 gap-3">

          {/* ESCROW */}
          <div className="card p-5 border border-amber-100 bg-amber-50/40">
            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
              <Clock size={14} />
              Pending Escrow
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {fmt(wallet?.pending_balance)}
            </div>
          </div>

          {/* TOTAL */}
          <div className="card p-5 border border-green-100 bg-green-50/40">
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">
              <BarChart3 size={14} />
              Total Pemasukan
            </div>
            <div className="text-2xl font-bold text-green-700">
              {fmt(wallet?.total_earned)}
            </div>
          </div>

        </div>
      </div>

      {/* ================= TRANSAKSI ================= */}
      <div className="card p-6 border border-green-100">

        <div className="flex items-center gap-2 mb-6">
          <FileText className="text-green-600" size={18} />
          <h2 className="font-bold text-green-900 text-sm">
            Riwayat Transaksi
          </h2>
        </div>

        <div className="py-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="text-green-400" />
          </div>

          <p className="text-sm text-green-700 font-medium">
            Belum ada riwayat transaksi
          </p>

          <p className="text-xs text-green-500 mt-1">
            Transaksi akan muncul setelah pesanan selesai
          </p>
        </div>

      </div>

    </div>
  );
}