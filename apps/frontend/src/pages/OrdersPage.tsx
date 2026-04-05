import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, Inbox, CreditCard, Truck, Search } from "lucide-react";
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../store/useModalStore';

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
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const { showAlert, showConfirm } = useModalStore();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) => api.post('/payment/create', { order_id: orderId }).then(r => r.data),
    onSuccess: (res: any) => {
      // Redirect to Midtrans
      if (res.data?.redirect_url) {
        window.location.href = res.data.redirect_url;
      }
    },
    onError: (err: any) => showAlert(err.response?.data?.error || 'Gagal menyiapkan pembayaran')
  });

  const trackMutation = useMutation({
    mutationFn: (waybill: string) => api.get(`/shipping/track/${waybill}?courier=jne`).then(r => r.data),
    onSuccess: (res: any) => {
      showAlert(`Status Pengiriman: ${res.data?.status || 'Tidak diketahui'}\nLokasi: ${res.data?.history?.[0]?.note || 'Tracking kosong'}`);
    },
    onError: () => showAlert('Gagal melacak pengiriman')
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/status`, { status: 'dibatalkan' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => showAlert(err.response?.data?.error || 'Gagal membatalkan pesanan')
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* 🔥 HEADER */}
      <div className="flex items-center gap-3">
        <Package size={26} className="text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            Pesanan Saya
          </h1>
          <p className="text-sm text-green-600">
            Semua pesanan sebagai buyer maupun seller
          </p>
        </div>
      </div>

      {/* 🔥 LOADING */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20 bg-green-50" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (

        /* 🔥 EMPTY STATE */
        <div className="card text-center py-16 flex flex-col items-center justify-center">
          <Inbox size={40} className="text-green-400 mb-3" />
          <p className="text-green-700 font-medium">Belum ada pesanan</p>
          <p className="text-xs text-green-500 mt-1">
            Pesanan akan muncul setelah transaksi dilakukan
          </p>
        </div>

      ) : (

        /* 🔥 LIST ORDER */
        <div className="space-y-3">
          {(data?.data ?? []).map((order: Record<string, unknown>, i: number) => {
            const status = STATUS_LABELS[String(order.status)] ?? {
              label: String(order.status).replace('_', ' ').toUpperCase(),
              cls: 'badge-green'
            };

            const isBuyer = order.buyer_id === user?.id;
            const isSeller = order.seller_id === user?.id;

            return (
              <motion.div
                key={String(order.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center justify-between hover:shadow-md transition"
              >
                {/* LEFT */}
                <div className="space-y-1">
                  <div className="font-semibold text-green-900 text-sm">
                    {String(order.product_name)}
                  </div>

                  <div className="text-xs text-green-600">
                    {String(order.store_name)} · {Number(order.quantity)} {String(order.unit)}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="font-bold text-green-800 text-sm">
                    Rp{Number(order.total_amount).toLocaleString('id-ID')}
                  </div>

                  <span className={`badge ${status.cls}`}>
                    {status.label}
                  </span>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-2">
                    {/* Buyer: Bayar */}
                    {isBuyer && (order.status === 'pending' || order.status === 'menunggu_bayar') && (
                      <>
                        <button
                          onClick={() => {
                            showConfirm('Yakin ingin membatalkan pesanan ini?', () => {
                              cancelMutation.mutate(String(order.id));
                            });
                          }}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                        >
                          BATAL
                        </button>
                        <button
                          onClick={() => {
                            if (order.payment_url) window.location.href = String(order.payment_url);
                            else payMutation.mutate(String(order.id));
                          }}
                          disabled={payMutation.isPending}
                          className="flex items-center gap-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                        >
                          <CreditCard size={12} /> BAYAR
                        </button>
                      </>
                    )}

                    {/* Seller: Proses Pengiriman (Dummy simulasi) */}
                    {isSeller && order.status === 'dibayar' && (
                      <button
                        onClick={() => showAlert(`Harap gunakan layanan Biteship API /api/shipping/book untuk order ini (ID: ${order.id})`)}
                        className="flex items-center gap-1 text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                      >
                        <Truck size={12} /> KIRIM
                      </button>
                    )}

                    {/* Both: Tracking */}
                    {['dikirim', 'diterima', 'selesai'].includes(String(order.status)) && Boolean(order.shipping_resi) && (
                      <button
                        onClick={() => trackMutation.mutate(String(order.shipping_resi))}
                        className="flex items-center gap-1 text-[10px] bg-green-100 hover:bg-green-200 text-green-800 border border-green-200 px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                      >
                        <Search size={12} /> LACAK
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      )}
    </div>
  );
}