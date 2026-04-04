import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import MapPicker from '../components/MapPicker';

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
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  const [storeForm, setStoreForm] = useState({
    name: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    postal_code: '',
    address: '',
    area_id: '',
    latitude: -6.2,
    longitude: 106.8,
    product_types: '',
    description: '',
    parent_store_id: ''
  });

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

  // ================= QUERY =================
  const { data: storeData, isLoading } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.get('/stores/me').then(r => r.data),
  });

  const stores = Array.isArray(storeData?.data) ? storeData.data : [];
  const hasStore = stores.length > 0;
  
  // Set default active store
  if (hasStore && !activeStoreId) {
    const main = stores.find((s: any) => s.is_main_branch) || stores[0];
    if (main) setActiveStoreId(main.id);
  }

  const activeStore = stores.find((s: any) => s.id === activeStoreId) || stores[0];

  const { data: productsData } = useQuery({
    queryKey: ['my-products', activeStore?.id],
    queryFn: () => api.get(`/products?store_id=${activeStore?.id}`).then(r => r.data),
    enabled: !!activeStore?.id && activeStoreId !== 'dashboard',
  });

  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => api.get('/orders/stats').then(r => r.data),
    enabled: activeStoreId === 'dashboard',
  });
  
  const PIE_COLORS = ['#16a34a', '#84cc16', '#eab308', '#f97316', '#3b82f6'];

  // ================= MUTATION =================
  const registerMutation = useMutation({
    mutationFn: (data: typeof storeForm) =>
      api.post('/stores', {
        ...data,
        product_types: data.product_types.split(',').map(s => s.trim()),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-store'] });
      setShowRegister(false);
    }
  });

  const productMutation = useMutation({
    mutationFn: (data: typeof productForm) => {
      if (editingProduct) {
        return api.patch(`/products/${editingProduct.id}`, data);
      }
      return api.post('/products', { ...data, store_id: activeStore?.id });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-products'] })
  });

  if (isLoading) {
    return <div className="p-10 text-center text-green-600">Memuat...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ================= HEADER (SELALU ADA) ================= */}
      <div className="flex items-center gap-3">
        <Store className="text-green-600" />
        <h1 className="text-2xl font-bold text-green-900">Toko Saya</h1>
      </div>

      {/* ================= BELUM ADA TOKO ================= */}
      {!hasStore ? (
        <div className="card text-center py-16">

          <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-2xl flex items-center justify-center">
            <Store className="text-green-500" size={28} />
          </div>

          <h2 className="text-lg font-bold text-green-900 mb-2">
            Belum punya toko?
          </h2>

          <p className="text-sm text-green-600 mb-6">
            Daftarkan toko Anda dan mulai jual produk pertanian langsung ke konsumen.
          </p>

          <button
            onClick={() => {
              setStoreForm({ ...storeForm, parent_store_id: '' });
              setShowRegister(true);
            }}
            className="btn-primary px-6 py-3"
          >
            + Daftar Toko Sekarang
          </button>

          {/* FORM REGISTER */}
          <AnimatePresence>
            {showRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 max-w-xl mx-auto space-y-3"
              >
                <input className="input-field" placeholder="Nama toko"
                  onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />

                <MapPicker onLocationSelect={(loc: any) =>
                  setStoreForm(f => ({
                    ...f,
                    latitude: loc.lat,
                    longitude: loc.lng,
                    address: loc.address,
                    provinsi: loc.province || '',
                    kabupaten: loc.kabupaten || loc.city || '',
                    kecamatan: loc.kecamatan || '',
                    postal_code: loc.postalCode || ''
                  }))
                } />

                <button
                  onClick={() => registerMutation.mutate(storeForm)}
                  className="btn-primary w-full"
                >
                  Simpan
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      ) : (

        /* ================= SUDAH ADA TOKO ================= */
        <>
          {/* TOKO TABS / SWITCHER */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b">
            <button
              onClick={() => setActiveStoreId('dashboard')}
              className={`px-4 py-2 whitespace-nowrap rounded-t-xl font-medium flex items-center gap-1 ${activeStoreId === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              <BarChart3 size={16} /> Dasbor Analitik
            </button>
            {stores.map((s: any) => (
              <button
                key={s.id}
                onClick={() => setActiveStoreId(s.id)}
                className={`px-4 py-2 whitespace-nowrap rounded-t-xl font-medium ${activeStoreId === s.id ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
              >
                {s.is_main_branch ? `🏢 Toko Utama: ${s.name}` : `📍 Cabang: ${s.name}`}
              </button>
            ))}
            <button
              onClick={() => {
                const mainStore = stores.find((s: any) => s.is_main_branch);
                setStoreForm({ ...storeForm, parent_store_id: mainStore?.id || stores[0].id });
                setShowRegister(true);
              }}
              className="px-4 py-2 rounded-t-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 flex items-center gap-1"
            >
              <Plus size={16} /> Tambah Cabang
            </button>
          </div>

          <AnimatePresence>
            {showRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 max-w-xl bg-white p-6 rounded-xl border border-orange-200 shadow-lg space-y-3 mb-6 relative z-50"
              >
                <h3 className="font-bold text-orange-800 border-b pb-2">Registrasi Toko Cabang Baru</h3>
                <input className="input-field" placeholder="Nama Cabang (Cth: Cabang Sleman)"
                  onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />

                <MapPicker onLocationSelect={(loc: any) =>
                  setStoreForm(f => ({ ...f, latitude: loc.lat, longitude: loc.lng, address: loc.address, provinsi: loc.province, kabupaten: loc.kabupaten || loc.city, kecamatan: loc.kecamatan, postal_code: loc.postalCode }))
                } />

                <div className="flex gap-2">
                   <button onClick={() => setShowRegister(false)} className="btn-secondary flex-1">Batal</button>
                   <button onClick={() => registerMutation.mutate(storeForm)} className="btn-primary flex-1 bg-orange-500 hover:bg-orange-600 border-none">Simpan Cabang</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeStoreId === 'dashboard' ? (
            <div className="space-y-6 mt-4">
              {/* KPI CARDS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-green-50 border-green-200">
                  <div className="text-sm font-semibold text-green-700">Total Omzet Bersih</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    Rp{statsData?.data?.stores?.reduce((acc: number, s: any) => acc + s.total_revenue, 0).toLocaleString('id-ID') || 0}
                  </div>
                </div>
                <div className="card bg-blue-50 border-blue-200">
                  <div className="text-sm font-semibold text-blue-700">Total Pesanan Selesai</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {statsData?.data?.stores?.reduce((acc: number, s: any) => acc + s.order_count, 0) || 0} Pesanan
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* LINE CHART TREN HARIAN */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4 items-center flex gap-2">Trend Penjualan (7 Hari)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={statsData?.data?.trends || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis tickFormatter={(val) => `Rp${val/1000}K`} tick={{fontSize: 12}} width={80} />
                        <RechartsTooltip formatter={(val: number) => `Rp${val.toLocaleString('id-ID')}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{r: 4}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PIE CHART DISTRIBUSI CABANG */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4 items-center flex gap-2">Kontribusi Pendapatan Cabang</h3>
                  <div className="h-64 flex flex-col justify-center relative">
                    {(!statsData?.data?.stores || statsData?.data?.stores.length === 0) ? (
                       <div className="text-center text-gray-400">Belum ada data penjualan</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statsData?.data?.stores}
                            dataKey="total_revenue"
                            nameKey="store_name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {statsData.data.stores.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(val: number) => `Rp${val.toLocaleString('id-ID')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* HEADER TOKO AKTIF */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border mt-4">
                <div>
                  <h2 className="text-xl font-bold text-green-900">{activeStore?.name}</h2>
                  <p className="text-sm text-green-600">
                    {activeStore?.kabupaten}, {activeStore?.provinsi}
                  </p>
                  {activeStore?.address && <p className="text-xs text-gray-500 mt-1">{activeStore.address}</p>}
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} /> Tambah Produk
                </button>
              </div>

              {/* PRODUK LIST */}
              <div className="card">
                {(productsData?.data ?? []).length === 0 ? (
                  <div className="py-16 text-center text-green-500">
                    Belum ada produk di cabang ini
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productsData.data.map((p: Product) => (
                      <div key={p.id} className="flex justify-between items-center p-4 border rounded-xl">

                        <div>
                          <div className="font-semibold text-green-900">{p.name}</div>
                          <div className="text-xs text-green-600">
                            {p.stock_quantity} {p.unit}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-green-700">
                            Rp{Number(p.price_per_unit).toLocaleString('id-ID')}
                          </div>

                          <div className="flex gap-2 mt-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm(p as any);
                                setShowProductModal(true);
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() => deleteProductMutation.mutate(p.id)}
                              className="p-2 bg-red-50 text-red-600 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}