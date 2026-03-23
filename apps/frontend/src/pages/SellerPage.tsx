import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function SellerPage() {
  const qc = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ name: '', kabupaten: '', provinsi: '', product_types: '' });

  const { data: storeData } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.get('/stores/me').then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get('/products?store_id=' + storeData?.data?.id).then(r => r.data),
    enabled: !!storeData?.data?.id,
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/stores', {
      ...data,
      product_types: data.product_types.split(',').map(s => s.trim()),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-store'] }); setShowRegister(false); },
  });

  const store = storeData?.data;

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-green-900 mb-2">🏪 Toko Saya</h1>
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🌾</div>
          <h2 className="font-bold text-green-900 mb-2">Belum punya toko?</h2>
          <p className="text-sm text-green-600 mb-6">Daftarkan toko Anda dan mulai jual produk pertanian langsung ke konsumen.</p>
          {!showRegister ? (
            <button className="btn-primary" onClick={() => setShowRegister(true)}>+ Daftar Toko Sekarang</button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left space-y-3 max-w-sm mx-auto">
              <input className="input-field" placeholder="Nama Toko" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input-field" placeholder="Kabupaten" value={form.kabupaten} onChange={e => setForm(f => ({ ...f, kabupaten: e.target.value }))} />
              <input className="input-field" placeholder="Provinsi" value={form.provinsi} onChange={e => setForm(f => ({ ...f, provinsi: e.target.value }))} />
              <input className="input-field" placeholder="Jenis Produk (pisah koma: Cabai, Sayuran)" value={form.product_types} onChange={e => setForm(f => ({ ...f, product_types: e.target.value }))} />
              <button className="btn-primary w-full justify-center" onClick={() => registerMutation.mutate(form)} disabled={registerMutation.isPending}>
                {registerMutation.isPending ? '⏳ Mendaftar...' : '✅ Daftar Toko'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-900">🏪 {store.name}</h1>
          <div className="flex gap-2 mt-2">
            <span className="badge badge-green">{store.store_code}</span>
            <span className="badge badge-green">{store.kabupaten}, {store.provinsi}</span>
            <span className="badge badge-green">⭐ {store.rating}</span>
          </div>
        </div>
        <button className="btn-primary text-sm">+ Tambah Produk</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '📦', label: 'Total Produk', value: productsData?.data?.length ?? 0 },
          { icon: '🛒', label: 'Total Pesanan', value: store.total_orders },
          { icon: '⭐', label: 'Rating', value: Number(store.rating).toFixed(1) },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-bold text-green-900 mb-4">📋 Produk Saya</h2>
        {(productsData?.data ?? []).length === 0 ? (
          <div className="text-center py-10 text-green-500">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-sm">Belum ada produk. Klik "+ Tambah Produk" untuk mulai berjualan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(productsData?.data ?? []).map((p: Record<string, unknown>) => (
              <div key={String(p.id)} className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                <div>
                  <div className="font-semibold text-sm text-green-900">{String(p.name)}</div>
                  <div className="text-xs text-green-600">Stok: {Number(p.stock_quantity)} {String(p.unit)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700 text-sm">Rp{Number(p.price_per_unit).toLocaleString('id-ID')}/{String(p.unit)}</div>
                  <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'} text-[10px]`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
