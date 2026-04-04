import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import logo from '../assets/agrihub-logo.png';

export default function MarketplacePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  return (
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* TITLE */}
        <div>
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <ShoppingCart size={22} />
            Marketplace Petani
          </h1>
          <p className="text-sm text-green-600 mt-1">
            Beli langsung dari petani tanpa perantara
          </p>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">

          {/* SEARCH */}
          <div className="relative w-full sm:w-60">
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500"
            />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-green-200 
              bg-white text-sm text-green-800 placeholder:text-green-400
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
              shadow-sm hover:shadow-md transition"
              placeholder="Cari produk..."
            />
          </div>

          {/* DROPDOWN */}
          <select
            className="w-full sm:w-48 py-2 px-3 rounded-xl border border-green-200 
            bg-white text-sm text-green-800 
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
            shadow-sm hover:shadow-md transition"
          >
            <option value="">Semua Kategori</option>
            <option value="sayuran">Sayuran</option>
            <option value="buah">Buah</option>
            <option value="bumbu-rempah">Bumbu & Rempah</option>
            <option value="biji-bijian">Biji-bijian</option>
          </select>

        </div>
      </div>

      {/* LOADING */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48 bg-green-50 rounded-xl" />
          ))}
        </div>
      ) : (

        <>
          {/* PRODUCT GRID */}
          {(data?.data ?? []).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {(data?.data ?? []).map((product: any, i: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300 flex flex-col"
                >

                  {/* IMAGE */}
                  <div className="w-full h-32 bg-green-50 flex items-center justify-center text-4xl relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : '🥦'}

                    {product.origin && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[9px] font-bold text-green-800 shadow-sm border border-green-100 uppercase">
                        📍 {product.origin}
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="font-bold text-green-900 text-sm truncate mb-1">
                      {product.name}
                    </div>

                    <div className="text-[10px] text-green-600 mb-2">
                      📦 {product.store_name} · {product.kabupaten}
                    </div>

                    <div className="mt-auto pt-2 border-t border-green-50">

                      <div className="font-extrabold text-green-700 text-sm">
                        Rp{Number(product.price_per_unit).toLocaleString('id-ID')}
                        <span className="text-[9px] text-green-500 ml-1">/{product.unit}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-slate-400 font-bold">
                          STOK: {product.stock_quantity} {product.unit}
                        </span>

                        <button className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold transition">
                          BELI
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (

            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center text-center py-20">

              <div className="w-24 h-24 rounded-2xl bg-green-100 flex items-center justify-center shadow-inner mb-6">
                <img src={logo} alt="logo" className="w-12 h-12 object-contain" />
              </div>

              <h2 className="text-xl font-bold text-green-900 mb-2">
                Belum Ada Produk
              </h2>

              <p className="text-green-600 text-sm max-w-md mb-6">
                Saat ini belum ada produk tersedia di marketplace.
                Petani dapat menambahkan produk melalui menu <b>Toko Saya</b>.
              </p>

              <Link
                to="/app/toko"
                className="flex items-center gap-2 px-6 py-3 rounded-xl 
                bg-gradient-to-r from-green-600 to-green-500 
                text-white font-semibold 
                shadow-lg shadow-green-500/30 
                hover:scale-105 transition"
              >
                ➕ Tambah Produk
              </Link>

            </div>
          )}
        </>
      )}
    </div>
  );
}