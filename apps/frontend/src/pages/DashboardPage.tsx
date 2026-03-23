import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  const user = useAuthStore(s => s.user);

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
    <div className="max-w-5xl mx-auto">
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
              { icon: '🏪', label: 'Buka Toko', to: '/app/toko' },
              { icon: '🛒', label: 'Pasar', to: '/app/marketplace' },
              { icon: '📈', label: 'Harga Pangan', to: '/app/harga' },
              { icon: '🤖', label: 'AI Chat', to: '/app/chat' },
            ].map(a => (
              <a key={a.label} href={a.to} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors cursor-pointer text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-semibold text-green-800">{a.label}</span>
              </a>
            ))}
          </div>
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
