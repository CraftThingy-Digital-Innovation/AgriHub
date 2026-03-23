import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function MarketplacePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">🛒 Marketplace Petani</h1>
          <p className="text-sm text-green-600 mt-1">Beli langsung dari petani tanpa perantara</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-48 text-sm" placeholder="🔍 Cari produk..." />
          <select className="input-field w-36 text-sm">
            <option value="">Semua Kategori</option>
            <option value="sayuran">Sayuran</option>
            <option value="buah">Buah</option>
            <option value="bumbu-rempah">Bumbu & Rempah</option>
            <option value="biji-bijian">Biji-bijian</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-green-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(data?.data ?? []).map((product: Record<string, unknown>, i: number) => (
            <motion.div
              key={String(product.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card card-hover cursor-pointer p-4"
            >
              <div className="w-full h-28 rounded-xl bg-green-50 flex items-center justify-center text-4xl mb-3">🥬</div>
              <div className="font-semibold text-green-900 text-sm truncate">{String(product.name)}</div>
              <div className="text-xs text-green-600 mb-2">{String(product.store_name)} · {String(product.kabupaten)}</div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-700 text-sm">
                  Rp{Number(product.price_per_unit).toLocaleString('id-ID')}/{String(product.unit)}
                </span>
                <span className="badge badge-green text-[10px]">{Number(product.stock_quantity)} {String(product.unit)}</span>
              </div>
            </motion.div>
          ))}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-4 text-center py-16 text-green-600">
              <div className="text-4xl mb-3">🌾</div>
              <p>Belum ada produk tersedia.<br />Petani bisa tambah produk via menu Toko Saya.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
