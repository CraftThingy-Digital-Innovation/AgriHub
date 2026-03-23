import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

interface Product {
  id: string;
  store_id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  stock_quantity: number;
  min_order: number;
  description: string;
  image_url?: string;
  weight_gram: number;
  sku?: string;
  origin?: string;
  images_json?: string;
  is_active: boolean;
}

export default function SellerPage() {
  const qc = useQueryClient();
  const [showRegister, setShowRegister] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStoreEdit, setShowStoreEdit] = useState(false);

  // Store Form State
  const [storeForm, setStoreForm] = useState({
    name: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    postal_code: '',
    address: '',
    product_types: '',
    description: ''
  });

  // Product Form State
  const initialProductForm = {
    name: '',
    category: 'sayuran',
    unit: 'kg',
    price_per_unit: 0,
    stock_quantity: 0,
    min_order: 1,
    description: '',
    weight_gram: 1000,
    sku: '',
    origin: '',
    images_json: '[]'
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  // Queries
  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.get('/stores/me').then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get('/products?store_id=' + storeData?.data?.id).then(r => r.data),
    enabled: !!storeData?.data?.id,
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (data: typeof storeForm) => api.post('/stores', {
      ...data,
      product_types: data.product_types.split(',').map(s => s.trim()),
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['my-store'] }); 
      setShowRegister(false); 
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: (data: typeof storeForm) => api.patch(`/stores/${storeData?.data?.id}`, {
      ...data,
      product_types: typeof data.product_types === 'string' ? data.product_types.split(',').map(s => s.trim()) : data.product_types,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-store'] });
      setShowStoreEdit(false);
    }
  });

  const productMutation = useMutation({
    mutationFn: (data: typeof productForm) => {
      if (editingProduct) {
        return api.patch(`/products/${editingProduct.id}`, data);
      }
      return api.post('/products', { ...data, store_id: storeData?.data?.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-products'] });
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm(initialProductForm);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-products'] });
    }
  });

  const store = storeData?.data;

  // Handlers
  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      price_per_unit: p.price_per_unit,
      stock_quantity: p.stock_quantity,
      min_order: p.min_order,
      description: p.description || '',
      weight_gram: p.weight_gram || 1000,
      sku: p.sku || '',
      origin: p.origin || '',
      images_json: p.images_json || '[]'
    });
    setShowProductModal(true);
  };

  const handleOpenRegister = () => {
    setStoreForm({
      name: '', provinsi: '', kabupaten: '', kecamatan: '', 
      postal_code: '', address: '', product_types: '', description: ''
    });
    setShowRegister(true);
  };

  const handleOpenStoreEdit = () => {
    setStoreForm({
      name: store.name,
      provinsi: store.provinsi,
      kabupaten: store.kabupaten,
      kecamatan: store.kecamatan || '',
      postal_code: store.postal_code || '',
      address: store.address || '',
      product_types: Array.isArray(store.product_types) ? store.product_types.join(', ') : store.product_types,
      description: store.description || ''
    });
    setShowStoreEdit(true);
  };

  if (storeLoading) return <div className="p-10 text-center animate-pulse text-green-600 font-medium">Memuat data toko...</div>;

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-green-900 mb-2">🏪 Toko Saya</h1>
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🌾</div>
          <h2 className="font-bold text-green-900 mb-2">Belum punya toko?</h2>
          <p className="text-sm text-green-600 mb-6">Daftarkan toko Anda dan mulai jual produk pertanian langsung ke konsumen.</p>
          {!showRegister ? (
            <button className="btn-primary" onClick={handleOpenRegister}>+ Daftar Toko Sekarang</button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-green-800 mb-1 block">Nama Toko</label>
                <input className="input-field" placeholder="Contoh: Tani Makmur Jaya" value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-green-800 mb-1 block">Provinsi</label>
                <input className="input-field" placeholder="Provinsi" value={storeForm.provinsi} onChange={e => setStoreForm(f => ({ ...f, provinsi: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-green-800 mb-1 block">Kabupaten</label>
                <input className="input-field" placeholder="Kabupaten" value={storeForm.kabupaten} onChange={e => setStoreForm(f => ({ ...f, kabupaten: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-green-800 mb-1 block">Kecamatan</label>
                <input className="input-field" placeholder="Kecamatan" value={storeForm.kecamatan} onChange={e => setStoreForm(f => ({ ...f, kecamatan: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-green-800 mb-1 block">Kode Pos</label>
                <input className="input-field" placeholder="Contoh: 38353" value={storeForm.postal_code} onChange={e => setStoreForm(f => ({ ...f, postal_code: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-green-800 mb-1 block">Alamat Lengkap</label>
                <textarea className="input-field h-20" placeholder="Jl. Raya Pertanian No. 1..." value={storeForm.address} onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-green-800 mb-1 block">Jenis Produk</label>
                <input className="input-field" placeholder="Contoh: Cabai, Sayuran, Beras" value={storeForm.product_types} onChange={e => setStoreForm(f => ({ ...f, product_types: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <button className="btn-secondary flex-1 justify-center" onClick={() => setShowRegister(false)}>Batal</button>
                <button className="btn-primary flex-1 justify-center" onClick={() => registerMutation.mutate(storeForm)} disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? '⏳ Mendaftar...' : '✅ Daftar Toko'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-green-900">🏪 {store.name}</h1>
            <button onClick={handleOpenStoreEdit} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors">Edit Profil</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="badge badge-green font-mono">{store.store_code}</span>
            <span className="badge badge-green">{store.kabupaten}, {store.provinsi}</span>
            <span className="badge badge-amber">⭐ {Number(store.rating).toFixed(1)}</span>
            {store.postal_code && <span className="badge badge-purple">📮 {store.postal_code}</span>}
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setEditingProduct(null); setProductForm(initialProductForm); setShowProductModal(true); }}>
          + Tambah Produk Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📦', label: 'Produk Aktif', value: (productsData?.data ?? []).filter((p: any) => p.is_active).length },
          { icon: '🛒', label: 'Pesanan Masuk', value: store.total_orders },
          { icon: '💰', label: 'Total Penjualan', value: 'Coming Soon' }, // Placeholder for real stats later
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="stat-value text-xl">{s.value}</div>
            <div className="stat-label uppercase tracking-wider text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-green-50 bg-green-50/30 flex justify-between items-center">
          <h2 className="font-bold text-green-900">📋 Daftar Produk Anda</h2>
          <span className="text-[10px] font-bold text-green-600 bg-white px-2 py-1 rounded-full border border-green-100">
            {productsData?.data?.length || 0} TOTAL
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-green-800 border-b border-green-50 text-[11px] uppercase tracking-widest">
                <th className="px-5 py-3 font-bold">Produk</th>
                <th className="px-5 py-3 font-bold">Stok & Unit</th>
                <th className="px-5 py-3 font-bold">Harga</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {(productsData?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-green-500">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="font-medium">Belum ada produk di etalase Anda.</p>
                    <button className="mt-3 text-xs text-green-700 underline" onClick={() => setShowProductModal(true)}>Mulai tambah produk pertama</button>
                  </td>
                </tr>
              ) : (
                productsData.data.map((p: Product) => (
                  <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg overflow-hidden border border-green-200">
                          {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : '🥦'}
                        </div>
                        <div>
                          <div className="font-bold text-green-900">{p.name}</div>
                          <div className="text-[10px] text-green-600 uppercase font-bold tracking-tight">{p.category} | SKU: {p.sku || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-green-800">{p.stock_quantity} <span className="text-[10px] border border-green-200 rounded px-1">{p.unit}</span></div>
                      <div className="text-[10px] text-green-500">Min: {p.min_order} | {p.weight_gram}g</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-green-700">
                      Rp{Number(p.price_per_unit).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'} text-[9px]`}>
                        {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button onClick={() => handleEditProduct(p)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">✎</button>
                        <button onClick={() => { if(confirm('Nonaktifkan produk ini?')) deleteProductMutation.mutate(p.id) }} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">✕</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProductModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10">
              <div className="px-6 py-4 border-b border-green-100 bg-green-50/50 flex justify-between items-center text-green-900">
                <h3 className="font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                <button onClick={() => setShowProductModal(false)} className="text-xl">✕</button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-green-800 mb-1 block">Nama Produk</label>
                  <input className="input-field" placeholder="Contoh: Cabai Keriting Organik" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Kategori</label>
                  <select className="input-field" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="sayuran">Sayuran</option>
                    <option value="buah">Buah-buahan</option>
                    <option value="biji-bijian">Biji-bijian / Beras</option>
                    <option value="umbian">Umbi-umbian</option>
                    <option value="olahan">Produk Olahan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Unit</label>
                  <input className="input-field" placeholder="kg, ikat, sak, dll" value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Harga Jual per Unit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-green-600 font-bold">Rp</span>
                    <input type="number" className="input-field pl-9" value={productForm.price_per_unit} onChange={e => setProductForm(f => ({ ...f, price_per_unit: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Stok Tersedia</label>
                  <input type="number" className="input-field" value={productForm.stock_quantity} onChange={e => setProductForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Minimal Order</label>
                  <input type="number" className="input-field" value={productForm.min_order} onChange={e => setProductForm(f => ({ ...f, min_order: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Berat (gram) <span className="text-[10px] lowercase font-normal italic">untuk ongkir</span></label>
                  <input type="number" className="input-field" value={productForm.weight_gram} onChange={e => setProductForm(f => ({ ...f, weight_gram: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">SKU / Kode Produk</label>
                  <input className="input-field" placeholder="PROD-001" value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Asal Daerah / Origin</label>
                  <input className="input-field" placeholder="Bengkulu Tengah" value={productForm.origin} onChange={e => setProductForm(f => ({ ...f, origin: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-green-800 mb-1 block">Deskripsi Produk</label>
                  <textarea className="input-field h-24" placeholder="Jelaskan kualitas, kesegaran, atau cara pengemasan produk Anda..." value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="md:col-span-2 border-t border-green-50 pt-4 flex gap-3">
                  <button className="btn-secondary flex-1 justify-center" onClick={() => setShowProductModal(false)}>Batal</button>
                  <button className="btn-primary flex-1 justify-center" onClick={() => productMutation.mutate(productForm)} disabled={productMutation.isPending}>
                    {productMutation.isPending ? '⏳ Memproses...' : (editingProduct ? '💾 Simpan Perubahan' : '🚀 Publish Produk')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Edit Modal */}
      <AnimatePresence>
        {showStoreEdit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStoreEdit(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10">
              <div className="px-6 py-4 border-b border-green-100 bg-green-50/50 flex justify-between items-center text-green-900 font-bold">
                <h3>Edit Profil Toko</h3>
                <button onClick={() => setShowStoreEdit(false)}>✕</button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[80vh]">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-green-800 mb-1 block">Nama Toko</label>
                  <input className="input-field" value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Provinsi</label>
                  <input className="input-field" value={storeForm.provinsi} onChange={e => setStoreForm(f => ({ ...f, provinsi: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Kabupaten</label>
                  <input className="input-field" value={storeForm.kabupaten} onChange={e => setStoreForm(f => ({ ...f, kabupaten: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Kecamatan</label>
                  <input className="input-field" value={storeForm.kecamatan} onChange={e => setStoreForm(f => ({ ...f, kecamatan: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-green-800 mb-1 block">Kode Pos</label>
                  <input className="input-field" value={storeForm.postal_code} onChange={e => setStoreForm(f => ({ ...f, postal_code: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-green-800 mb-1 block">Alamat Lengkap</label>
                  <textarea className="input-field h-20" value={storeForm.address} onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-green-800 mb-1 block">Deskripsi Toko</label>
                  <textarea className="input-field h-20" value={storeForm.description} onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="md:col-span-2 flex gap-3 pt-4">
                   <button className="btn-secondary flex-1 justify-center" onClick={() => setShowStoreEdit(false)}>Batal</button>
                   <button className="btn-primary flex-1 justify-center" onClick={() => updateStoreMutation.mutate(storeForm)} disabled={updateStoreMutation.isPending}>
                    {updateStoreMutation.isPending ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
