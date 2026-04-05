import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import logo from '../assets/agrihub-logo.png';
import MapPicker from '../components/MapPicker';
import { MapPin } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../store/useModalStore';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showAlert } = useModalStore();
  const qc = useQueryClient();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [address, setAddress] = useState<string>(''); // fallback
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressMap, setShowAddressMap] = useState<boolean>(false);
  const [newAddressForm, setNewAddressForm] = useState<any>({ lat: 0, lng: 0, address: '', label: '', recipient_name: '', recipient_phone: '' });
  const [notes, setNotes] = useState<string>('');

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [loadingOngkir, setLoadingOngkir] = useState(false);

  const { data: addressData } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => api.get('/users/addresses').then(r => r.data.data),
  });

  const addAddressMutation = useMutation({
    mutationFn: (payload: any) => api.post('/users/addresses', payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-addresses'] });
      setSelectedAddressId(res.data.data.id);
      setShowAddressMap(false);
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  // Effect auto-open product from URL parameter
  useEffect(() => {
    const buyId = searchParams.get('buy');
    if (buyId && data?.data) {
      const p = data.data.find((x: any) => x.id === buyId);
      if (p) {
        setSelectedProduct(p);
        setQuantity(p.min_order || 1);
        searchParams.delete('buy');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, data, setSearchParams]);

  // Effect fetch ongkir
  useEffect(() => {
    if (!selectedAddressId || !selectedProduct?.store_postal_code || !addressData) {
      setShippingRates([]);
      setSelectedShipping(null);
      return;
    }
    const selAddr = addressData.find((a: any) => a.id === selectedAddressId);
    if (!selAddr?.postal_code) return;

    const wGram = (selectedProduct.weight_gram || 1000) * quantity;
    setLoadingOngkir(true);
    api.post('/shipping/check-ongkir', {
      origin_postal_code: selectedProduct.store_postal_code,
      destination_postal_code: selAddr.postal_code,
      weight_gram: wGram
    }).then(res => {
      setShippingRates(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedShipping(res.data.data[0]);
      else setSelectedShipping(null);
    }).catch(err => {
      console.error('Gagal fetch ongkir', err);
      // Fallback dummy ongkir untuk dev/testing jika API Biteship gagal //
      const defaultOngkir = [{ courier: 'JNE', service: 'REG', price: 15000, estimated_days: '2-3', description: 'Reguler' }];
      setShippingRates(defaultOngkir);
      setSelectedShipping(defaultOngkir[0]);
    }).finally(() => setLoadingOngkir(false));
  }, [selectedAddressId, selectedProduct, quantity, addressData]);

  const orderMutation = useMutation({
    mutationFn: (payload: { product_id: string; quantity: number; notes: string; shipping_fee: number; shipping_courier: string; shipping_service: string }) => 
        api.post('/orders', payload),
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['orders'] });
        setSelectedProduct(null);
        navigate('/app/pesanan');
    },
    onError: (err: any) => {
        showAlert(err.response?.data?.error || 'Gagal membuat pesanan');
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
                            if (product) {
                              setSelectedProduct(product);
                              setQuantity(product.min_order);
                              if (addressData && addressData.length > 0) {
                                setSelectedAddressId(addressData[0].id);
                              }
                            }
                            setAddress('');
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
                <div className="space-y-3 p-4 bg-white rounded-xl border-2 border-green-50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <MapPin size={64} />
                  </div>
                  
                  {!showAddressMap ? (
                    <>
                      <div className="flex justify-between items-center z-10 relative">
                        <label className="block text-sm font-bold text-slate-700">Daftar Alamat Pengiriman</label>
                        <button 
                          onClick={() => setShowAddressMap(true)}
                          className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition"
                        >
                          + Tambah Alamat Baru
                        </button>
                      </div>
                      
                      {addressData && addressData.length > 0 ? (
                        <select 
                          className="w-full input-field z-10 relative bg-white"
                          value={selectedAddressId}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                        >
                          {addressData.map((addr: any) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.label} — {addr.recipient_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                          Belum ada alamat. Silakan tambah alamat.
                        </div>
                      )}
                      
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none h-16 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none relative z-10 mt-2"
                        placeholder="Catatan tambahan kurir (Opsional)"
                      />
                    </>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 relative z-10 bg-white">
                      <div className="flex justify-between items-center border-b pb-2">
                        <label className="block text-sm font-bold text-slate-700">Tambah Alamat Baru</label>
                        <button onClick={() => setShowAddressMap(false)} className="text-xs font-bold text-red-500 hover:text-red-700">
                          Batal
                        </button>
                      </div>

                      <MapPicker onLocationSelect={(loc: any) => 
                        setNewAddressForm((f: any) => ({
                          ...f,
                          latitude: loc.lat, longitude: loc.lng,
                          full_address: loc.address,
                          provinsi: loc.province || '', kabupaten: loc.kabupaten || loc.city || '', kecamatan: loc.kecamatan || '', postal_code: loc.postalCode || ''
                        }))
                      } />
                      
                      {newAddressForm.latitude ? (
                        <div className="space-y-2 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input-field text-sm" placeholder="Label (ex: Rumah / Kantor)" onChange={e => setNewAddressForm((f: any) => ({ ...f, label: e.target.value }))} />
                            <input className="input-field text-sm" placeholder="Nama Penerima" onChange={e => setNewAddressForm((f: any) => ({ ...f, recipient_name: e.target.value }))} />
                          </div>
                          <input className="input-field text-sm w-full" placeholder="No HP (+62...)" onChange={e => setNewAddressForm((f: any) => ({ ...f, recipient_phone: e.target.value }))} />
                          <textarea 
                            className="input-field text-sm min-h-[60px]" 
                            placeholder="Detail Jalan (Wajib)" 
                            value={newAddressForm.full_address || ''} 
                            onChange={e => setNewAddressForm((f: any) => ({ ...f, full_address: e.target.value }))} 
                          />
                          <button 
                            onClick={() => addAddressMutation.mutate(newAddressForm)}
                            disabled={!newAddressForm.full_address || !newAddressForm.label || !newAddressForm.recipient_name || addAddressMutation.isPending}
                            className="btn-primary w-full text-sm py-2 bg-blue-600 hover:bg-blue-700"
                          >
                           {addAddressMutation.isPending ? 'Menyimpan...' : 'Simpan & Gunakan'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* SHIPPING PICKER */}
                {selectedAddressId && !showAddressMap && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Pengiriman</label>
                    {loadingOngkir ? (
                      <div className="text-sm text-slate-500 animate-pulse">Menghitung ongkos kirim...</div>
                    ) : shippingRates.length > 0 ? (
                      <select 
                        className="w-full input-field bg-white text-sm"
                        value={selectedShipping ? `${selectedShipping.courier}-${selectedShipping.service}` : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = shippingRates.find(r => `${r.courier}-${r.service}` === val);
                          setSelectedShipping(found || null);
                        }}
                      >
                        {shippingRates.map((r, i) => (
                          <option key={i} value={`${r.courier}-${r.service}`}>
                            {r.courier.toUpperCase()} {r.service} — Rp{r.price.toLocaleString('id-ID')} ({r.estimated_days} Hari)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-red-500">
                        Ongkos kirim tidak tersedia untuk rute ini (Kode pos tidak valid).
                      </div>
                    )}
                  </div>
                )}

                {/* PAYMENT SUMMARY */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-700 mb-3">Ringkasan Pembayaran</div>
                  
                  <div className="space-y-1 text-sm text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span>Total Harga ({quantity} Barang)</span>
                      <span>Rp{(selectedProduct.price_per_unit * quantity).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedShipping && (
                      <div className="flex justify-between">
                        <span>Ongkos Kirim ({selectedShipping.courier})</span>
                        <span>Rp{selectedShipping.price.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Biaya Layanan (2%)</span>
                      <span>Rp{Math.round((selectedProduct.price_per_unit * quantity) * 0.02).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PPN (11%)</span>
                      <span>Rp{Math.round((selectedProduct.price_per_unit * quantity) * 0.11).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-dashed mt-2 pt-2 flex justify-between font-bold text-lg text-green-700">
                      <span>Total Tagihan</span>
                      <span>
                        Rp{(
                          (selectedProduct.price_per_unit * quantity) + 
                          Math.round((selectedProduct.price_per_unit * quantity) * 0.02) + 
                          Math.round((selectedProduct.price_per_unit * quantity) * 0.11) + 
                          (selectedShipping ? selectedShipping.price : 0)
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => {
                          let finalAddressPayload = "";
                          if (selectedAddressId) {
                              const sel = addressData?.find((a: any) => a.id === selectedAddressId);
                              if (sel) finalAddressPayload = `ALAMAT_SISTEM:[${sel.id}] ${sel.label} - ${sel.recipient_name} | ${sel.full_address}`;
                          } else {
                              showAlert("Harap pilih atau tambah alamat pengiriman!");
                              return;
                          }
                          if (!selectedShipping) {
                              showAlert("Harap tunggu atau pilih ongkos kirim!");
                              return;
                          }

                          orderMutation.mutate({ 
                            product_id: selectedProduct.id, 
                            quantity, 
                            notes: `[Alamat]: ${finalAddressPayload}\n\n[Catatan]: ${notes}`,
                            shipping_fee: selectedShipping.price,
                            shipping_courier: selectedShipping.courier,
                            shipping_service: selectedShipping.service
                          });
                      }}
                      disabled={orderMutation.isPending || showAddressMap || !selectedAddressId || !selectedShipping || quantity < selectedProduct.min_order || quantity > selectedProduct.stock_quantity}
                      className="bg-green-600 hover:bg-green-700 w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderMutation.isPending ? 'Memproses...' : 'Buat Pesanan & Bayar'}
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}