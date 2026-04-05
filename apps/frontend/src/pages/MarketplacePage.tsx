import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import logo from '../assets/agrihub-logo.png';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const orderMutation = useMutation({
    mutationFn: (payload: { product_id: string; quantity: number; notes: string }) => 
        api.post('/orders', payload),
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['orders'] });
        setSelectedProduct(null);
        navigate('/app/pesanan');
    },
    onError: (err: any) => {
        alert(err.response?.data?.error || 'Gagal membuat pesanan');
    }
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

                        <button 
                          onClick={() => {
                            setSelectedProduct(product);
                            setQuantity(product.min_order || 1);
                            setNotes('');
                          }}
                          className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold transition"
                        >
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

            </div>
          )}
        </>
      )}

      {/* CHECKOUT MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold text-green-900 mb-4 border-b pb-3 flex items-center gap-2">
                <ShoppingCart className="text-green-600" />
                Checkout Tersertifikasi
              </h3>

              <div className="flex gap-4 items-start bg-green-50 p-3 rounded-xl mb-5">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover shadow-sm bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-3xl shadow-sm border border-green-100">
                    🥦
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-green-900 text-base">{selectedProduct.name}</h4>
                  <p className="text-xs text-green-700 mb-1">Toko: <span className="font-medium">{selectedProduct.store_name}</span></p>
                  <p className="text-sm font-extrabold text-green-800">
                    Rp{Number(selectedProduct.price_per_unit).toLocaleString('id-ID')} / {selectedProduct.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Jumlah Pembelian (Minimal: {selectedProduct.min_order})
                  </label>
                  <div className="flex items-center gap-0">
                    <button 
                      onClick={() => setQuantity(Math.max(selectedProduct.min_order, quantity - 1))}
                      className="bg-green-100 text-green-800 px-4 py-2 rounded-l-xl font-bold hover:bg-green-200 transition"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(selectedProduct.min_order, Number(e.target.value)))}
                      className="w-full text-center border-y border-green-200 py-2 focus:outline-none font-semibold text-slate-800"
                      min={selectedProduct.min_order}
                      max={selectedProduct.stock_quantity}
                    />
                    <button 
                      onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                      className="bg-green-100 text-green-800 px-4 py-2 rounded-r-xl font-bold hover:bg-green-200 transition"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    Tersedia {selectedProduct.stock_quantity} {selectedProduct.unit}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Catatan untuk Penjual (Opsional)
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full input-field resize-none h-20 text-sm"
                    placeholder="Contoh: Tolong pilihkan yang merah-merah ya pak..."
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Total Pembayaran</div>
                  <div className="text-xl font-black text-green-700">
                    Rp{(selectedProduct.price_per_unit * quantity).toLocaleString('id-ID')}
                  </div>
                </div>
                <button 
                  onClick={() => orderMutation.mutate({ 
                    product_id: selectedProduct.id, 
                    quantity, 
                    notes 
                  })}
                  disabled={orderMutation.isPending || quantity < selectedProduct.min_order || quantity > selectedProduct.stock_quantity}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderMutation.isPending ? 'Memproses...' : 'Beli Sekarang'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}