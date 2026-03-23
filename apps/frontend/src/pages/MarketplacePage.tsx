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
          {(data?.data ?? []).map((product: any, i: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card card-hover cursor-pointer p-0 overflow-hidden flex flex-col h-full shadow-sm"
            >
              <div className="w-full h-32 bg-green-50 flex items-center justify-center text-4xl relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : '🥦'}
                {product.origin && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[9px] font-bold text-green-800 shadow-sm border border-green-100 uppercase tracking-tighter">
                    📍 {product.origin}
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="font-bold text-green-900 text-sm truncate leading-tight mb-0.5">{product.name}</div>
                <div className="text-[10px] text-green-600 mb-2 font-medium">📦 {product.store_name} · {product.kabupaten}</div>
                
                <div className="mt-auto pt-2 flex flex-col gap-1.5 border-t border-green-50">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-green-700 text-sm">
                      Rp{Number(product.price_per_unit).toLocaleString('id-ID')}
                      <span className="text-[9px] font-normal text-green-500 ml-0.5">/{product.unit}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">STOK: {Number(product.stock_quantity)} {product.unit}</span>
                    <button className="text-[10px] bg-green-600 text-white font-bold px-2 py-1 rounded">BELI</button>
                  </div>
                </div>
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
