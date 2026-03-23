import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Menunggu Bayar', cls: 'badge-amber' },
  dibayar:    { label: 'Sudah Dibayar', cls: 'badge-blue' },
  diproses:   { label: 'Diproses', cls: 'badge-blue' },
  dikirim:    { label: 'Dikirim', cls: 'badge-purple' },
  diterima:   { label: 'Diterima', cls: 'badge-green' },
  selesai:    { label: 'Selesai', cls: 'badge-green' },
  sengketa:   { label: 'Sengketa', cls: 'badge-red' },
  dibatalkan: { label: 'Dibatalkan', cls: 'badge-red' },
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-green-900 mb-2">📦 Pesanan Saya</h1>
      <p className="text-sm text-green-600 mb-6">Semua pesanan sebagai buyer maupun seller.</p>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-20 bg-green-50" />)}</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-green-700">Belum ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data ?? []).map((order: Record<string, unknown>, i: number) => {
            const status = STATUS_LABELS[String(order.status)] ?? { label: String(order.status), cls: 'badge-green' };
            return (
              <motion.div
                key={String(order.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-green-900 text-sm">{String(order.product_name)}</div>
                  <div className="text-xs text-green-600">{String(order.store_name)} · {Number(order.quantity)} {String(order.unit)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-800 text-sm">Rp{Number(order.total_amount).toLocaleString('id-ID')}</div>
                  <span className={`badge ${status.cls} mt-1`}>{status.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
