import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import logo from '../assets/agrihub-logo.png';
import {
  Link2,
  ClipboardList,
  Target,
  ArrowRight,
  MapPin
} from "lucide-react";

interface KomoditasItem { id: string; nama: string; kategori: string; }
interface MatchRecord {
  id: string;
  product_name: string;
  demand_qty: number;
  product_price: number;
  score: number;
  store_name: string;
  store_kabupaten: string;
  demand_komoditas: string;
}
interface Address {
  id: string;
  label: string;
  full_address: string;
  kabupaten: string;
}

export default function MatchingPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'feed' | 'demand'>('feed');

  const [demandForm, setDemandForm] = useState({
    komoditas: '',
    jumlah_kg: '',
    harga_max_per_kg: '',
    address_id: ''
  });

  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  const { data: addressData } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => api.get('/users/addresses').then(r => r.data),
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['matching-feed'],
    queryFn: () => api.get('/matching/feed').then(r => r.data),
  });

  const demandMutation = useMutation({
    mutationFn: (data: typeof demandForm) =>
      api.post('/matching/demand', {
        ...data,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['matching-feed'] });
      setActiveTab('feed');
      if (res.data?.data?.matches_found > 0) {
        alert(`Berhasil membuat Wishlist! Ditemukan ${res.data.data.matches_found} produk yang cocok.`);
      }
    },
  });

  const komoditasList: KomoditasItem[] = komoditasData?.data || [];
  const feed: MatchRecord[] = feedData?.data || [];
  const addresses: Address[] = addressData?.data || [];

  const setD = (k: string) => (e: any) =>
    setDemandForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <Link2 size={22} />
          Wishlist & Matching
        </h1>
        <p className="text-sm text-green-600 mt-1">
          Buat Wishlist belanjaan Anda, dan sistem akan mencarikan Petani yang cocok dari seluruh Indonesia!
        </p>
      </div>

      {/* TAB */}
      <div className="flex bg-green-50 rounded-xl p-1 mb-6 w-fit gap-1">
        {[
          { key: 'feed', label: 'Feed Promo', icon: <ClipboardList size={16} /> },
          { key: 'demand', label: 'Buat Wishlist', icon: <Target size={16} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg transition
            ${activeTab === tab.key
              ? 'bg-white text-green-800 shadow'
              : 'text-green-600'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ================= FEED ================= */}
        {activeTab === 'feed' && (
          <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card animate-pulse h-24 bg-green-50" />
                ))}
              </div>
            ) : feed.length === 0 ? (

              /* EMPTY STATE */
              <div className="card text-center py-20 flex flex-col items-center
              bg-gradient-to-br from-white to-green-50 shadow-xl border border-green-100">

                <div className="w-24 h-24 rounded-2xl bg-green-100 flex items-center justify-center shadow-inner mb-6">
                  <img src={logo} className="w-12 h-12 object-contain" />
                </div>

                <h3 className="font-bold text-green-900 text-lg mb-2">
                  Belum ada matching aktif
                </h3>

                <p className="text-sm text-green-600 mb-6 max-w-md">
                  Yuk, buar Wishlist komoditas yang kamu cari supaya kami bisa mencarikannya untukmu!
                </p>

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    onClick={() => setActiveTab('demand')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl 
                    bg-gradient-to-r from-green-600 to-green-500 
                    text-white font-semibold shadow-lg hover:scale-105 transition"
                  >
                    <Target size={16} />
                    Buat Wishlist Baru
                  </button>

                </div>
              </div>

            ) : (

              <div className="space-y-3">
                {feed.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card p-5 hover:shadow-md transition border-l-4 border-l-green-500"
                  >
                    <div className="flex justify-between items-center">

                      <div>
                        <div className="font-bold text-lg text-green-900">
                          {m.product_name}
                        </div>
                        <div className="text-sm mt-1 flex text-gray-500 items-center gap-2">
                           <span className="font-medium text-green-800">{m.store_name}</span> ({m.store_kabupaten})
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full mt-2 font-medium">
                           Cocok untul wishlist: {m.demand_komoditas} ({m.demand_qty} kg)
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="font-bold text-2xl text-green-600 tracking-tight">
                          Rp{m.product_price.toLocaleString('id-ID')}<span className="text-sm text-gray-500 font-normal">/kg</span>
                        </div>
                        <a 
                          href={`https://wa.me/${(import.meta as any).env.VITE_WA_BOT_NUMBER}?text=BELI%20${m.id}`}
                          target="_blank" rel="noreferrer"
                          className="mt-3 flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold transition"
                        >
                           Beli via WA <ArrowRight size={14} />
                        </a>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>

            )}
          </motion.div>
        )}

        {/* ================= DEMAND ================= */}
        {activeTab === 'demand' && (
          <motion.div className="card max-w-lg mx-auto p-6">
            <h2 className="font-bold text-green-900 mb-2 flex items-center gap-2 text-xl">
              <Target size={20} className="text-green-600" />
              Buat Wishlist
            </h2>
            <p className="text-sm text-gray-500 mb-6">Kami akan mencarikan penawaran terbaik sesuai dengan budget dan alamat Anda.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang / Komoditas</label>
                <input 
                  className="input-field w-full" 
                  placeholder="Contoh: Cabai Merah Keriting" 
                  onChange={setD('komoditas')} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kebutuhan (kg)</label>
                  <input className="input-field w-full" placeholder="e.g. 50" type="number" onChange={setD('jumlah_kg')} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Harga Maks / kg</label>
                   <input className="input-field w-full" placeholder="e.g. 45000" type="number" onChange={setD('harga_max_per_kg')} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin size={14}/> Alamat Pengiriman
                </label>
                {addresses.length === 0 ? (
                    <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                        Anda belum menambahkan alamat buku. Silakan ke profil untuk menambah alamat!
                    </div>
                ) : (
                    <select className="input-field w-full" onChange={setD('address_id')}>
                      <option value="">Pilih alamat tujuan...</option>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>{a.label} - {a.kabupaten}</option>
                      ))}
                    </select>
                )}
              </div>

              <button 
                className="btn-primary w-full mt-4 flex justify-center py-3 text-base" 
                onClick={() => demandMutation.mutate(demandForm)}
                disabled={demandMutation.isPending || addresses.length === 0}
              >
                {demandMutation.isPending ? 'Menyimpan...' : 'Simpan Wishlist'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}