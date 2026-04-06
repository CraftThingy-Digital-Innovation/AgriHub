import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import {
  Wallet,
  Hourglass,
  Package,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Bot
} from "lucide-react";

// =====================
// STAT CARD
// =====================
function StatCard({
  icon,
  label,
  value,
  change,
  up
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  up?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-100 text-green-700">
          {icon}
        </div>

        {change && (
          <span className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
            {change}
          </span>
        )}
      </div>

      <div className="text-xl font-bold text-green-900">{value}</div>
      <div className="text-xs text-green-600">{label}</div>
    </motion.div>
  );
}

// =====================
// MAIN PAGE
// =====================
export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data.wallet),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders-summary'],
    queryFn: () => api.get('/orders').then(r => r.data),
  });

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 11
      ? 'Selamat Pagi'
      : greetingHour < 15
      ? 'Selamat Siang'
      : greetingHour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  const formatRp = (n: number) => `Rp${n?.toLocaleString('id-ID') ?? '0'}`;

  return (
    <div className="max-w-6xl mx-auto">

      {/* GREETING */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-green-600 text-sm mt-1">
          Berikut ringkasan aktivitas platform AgriHub Anda.
        </p>
      </div>

      {/* ===================== */}
      {/* STAT */}
      {/* ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Wallet size={20} />} label="Saldo Dompet" value={formatRp(wallet?.balance ?? 0)} />
        <StatCard icon={<Hourglass size={20} />} label="Pending Escrow" value={formatRp(wallet?.pending_balance ?? 0)} />
        <StatCard icon={<Package size={20} />} label="Total Pesanan" value={String(ordersData?.data?.length ?? 0)} change="↑ hari ini" up />
        <StatCard icon={<CreditCard size={20} />} label="Total Pemasukan" value={formatRp(wallet?.total_earned ?? 0)} />
      </div>

      {/* ===================== */}
      {/* CONTENT */}
      {/* ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* QUICK ACTION */}
        <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
            ⚡ Aksi Cepat
          </h2>

          <div className="grid grid-cols-2 gap-3">

            <a href="/app/marketplace" className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition">
              <div className="text-green-700 group-hover:scale-110 transition">
                <ShoppingCart size={22} />
              </div>
              <span className="text-xs font-semibold text-green-800">Pasar</span>
            </a>

            <a href="/app/harga" className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition">
              <div className="text-green-700 group-hover:scale-110 transition">
                <BarChart3 size={22} />
              </div>
              <span className="text-xs font-semibold text-green-800">Harga Pangan</span>
            </a>

          </div>

          {/* AI CARD */}
          <a href="/app/chat" className="mt-4 block group">
            <div className="rounded-2xl bg-gradient-to-br from-green-600 to-green-500 p-6 min-h-[200px] flex flex-col justify-between hover:shadow-xl transition relative overflow-hidden">

              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-700"></div>

              <div>
                <div className="flex items-center gap-2 text-white mb-2">
                  <Bot size={22} />
                  <span className="font-bold text-lg">Asisten AI Tani</span>
                </div>

                <p className="text-white/80 text-sm">
                  Konsultasikan masalah hama, harga, atau teknik tanam langsung di sini.
                </p>
              </div>

              <div className="flex justify-between mt-4">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${user?.puter_token ? 'bg-white/20 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                  {user?.puter_token ? 'AI Aktif' : 'AI Belum Terhubung'}
                </span>

                <span className="text-sm font-semibold">
                  {user?.puter_token ? 'Tanya AI →' : 'Hubungkan →'}
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* PILAR */}
        <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-green-900 mb-4">
            📋 4 Pilar Platform
          </h2>

          <div className="space-y-4">

            <div className="flex gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-green-700">
                <ShoppingCart size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">Marketplace</div>
                <div className="text-xs text-green-600">Jual beli langsung</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                <Package size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">Matching Stok</div>
                <div className="text-xs text-green-600">Supply-demand</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center text-sky-700">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">Monitor Harga</div>
                <div className="text-xs text-green-600">Pantau inflasi</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700">
                <CreditCard size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-900">Logistik</div>
                <div className="text-xs text-green-600">Multi kurir</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}