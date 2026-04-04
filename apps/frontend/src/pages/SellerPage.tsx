import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Pencil, Trash2 } from 'lucide-react';
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
    description: ''
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

  const store = storeData?.data;

  const { data: productsData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get(`/products?store_id=${store?.id}`).then(r => r.data),
    enabled: !!store?.id,
  });

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
      return api.post('/products', { ...data, store_id: store?.id });
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
      {!store ? (
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
            onClick={() => setShowRegister(true)}
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
                    address: loc.address
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
          {/* HEADER TOKO */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-900">{store.name}</h2>
              <p className="text-sm text-green-600">
                {store.kabupaten}, {store.provinsi}
              </p>
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
                Belum ada produk
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

    </div>
  );
}