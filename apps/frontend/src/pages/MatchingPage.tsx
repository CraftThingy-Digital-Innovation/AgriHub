import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import logo from '../assets/agrihub-logo.png';
import {
  Link2,
  ClipboardList,
  Package,
  Target,
  ArrowRightLeft
} from "lucide-react";

interface KomoditasItem { id: string; nama: string; kategori: string; }
interface MatchRecord {
  id: string;
  komoditas_nama: string;
  quantity_matched: number;
  suggested_price: number;
  match_score: number;
  supply_kabupaten: string;
  supply_provinsi: string;
  demand_kabupaten: string;
  demand_provinsi: string;
}

export default function MatchingPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'feed' | 'supply' | 'demand'>('feed');

  const [supplyForm, setSupplyForm] = useState({
    komoditas_id: '',
    quantity_kg: '',
    price_per_kg: '',
    kabupaten: '',
    provinsi: ''
  });

  const [demandForm, setDemandForm] = useState({
    komoditas_id: '',
    quantity_kg: '',
    max_price_per_kg: '',
    kabupaten: '',
    provinsi: '',
    needed_by: ''
  });

  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['matching-feed'],
    queryFn: () => api.get('/matching/feed').then(r => r.data),
  });

  const supplyMutation = useMutation({
    mutationFn: (data: typeof supplyForm) =>
      api.post('/matching/supply', {
        ...data,
        quantity_kg: Number(data.quantity_kg),
        price_per_kg: Number(data.price_per_kg)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matching-feed'] });
      setActiveTab('feed');
    },
  });

  const demandMutation = useMutation({
    mutationFn: (data: typeof demandForm) =>
      api.post('/matching/demand', {
        ...data,
        quantity_kg: Number(data.quantity_kg),
        max_price_per_kg: Number(data.max_price_per_kg)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matching-feed'] });
      setActiveTab('feed');
    },
  });

  const komoditasList: KomoditasItem[] = komoditasData?.data || [];
  const feed: MatchRecord[] = feedData?.data || [];

  const setS = (k: string) => (e: any) =>
    setSupplyForm(f => ({ ...f, [k]: e.target.value }));

  const setD = (k: string) => (e: any) =>
    setDemandForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <Link2 size={22} />
          Matching Demand-Supply
        </h1>
        <p className="text-sm text-green-600 mt-1">
          Lapor surplus stok atau kebutuhan komoditas — sistem otomatis mencocokkan berdasarkan wilayah & harga
        </p>
      </div>

      {/* TAB */}
      <div className="flex bg-green-50 rounded-xl p-1 mb-6 w-fit gap-1">
        {[
          { key: 'feed', label: 'Feed', icon: <ClipboardList size={16} /> },
          { key: 'supply', label: 'Lapor Stok', icon: <Package size={16} /> },
          { key: 'demand', label: 'Lapor Kebutuhan', icon: <Target size={16} /> }
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
                  Lapor surplus stok atau kebutuhan komoditas agar sistem dapat mencocokkan otomatis.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    onClick={() => setActiveTab('supply')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl 
                    bg-gradient-to-r from-green-600 to-green-500 
                    text-white font-semibold shadow-lg hover:scale-105 transition"
                  >
                    <Package size={16} />
                    Lapor Stok
                  </button>

                  <button
                    onClick={() => setActiveTab('demand')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl 
                    border border-green-300 text-green-700 
                    bg-white hover:bg-green-50 font-semibold transition"
                  >
                    <Target size={16} />
                    Lapor Kebutuhan
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
                    className="card p-5 hover:shadow-md transition"
                  >
                    <div className="flex justify-between">

                      <div>
                        <div className="font-bold text-green-900">
                          {m.komoditas_nama}
                        </div>

                        <div className="text-sm text-green-600 mt-1 flex items-center gap-2">
                          <ArrowRightLeft size={14} />
                          {m.supply_kabupaten} → {m.demand_kabupaten}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-green-700">
                          Rp{m.suggested_price.toLocaleString('id-ID')}/kg
                        </div>
                        <div className="text-xs text-green-500">
                          {m.quantity_matched} kg
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>

            )}
          </motion.div>
        )}

        {/* ================= SUPPLY ================= */}
        {activeTab === 'supply' && (
          <motion.div className="card max-w-lg mx-auto p-5">
            <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Package size={18} />
              Lapor Stok
            </h2>

            <div className="space-y-3">
              <select className="input-field" onChange={setS('komoditas_id')}>
                <option value="">Pilih komoditas...</option>
                {komoditasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>

              <input className="input-field" placeholder="Jumlah (kg)" type="number" onChange={setS('quantity_kg')} />
              <input className="input-field" placeholder="Harga/kg" type="number" onChange={setS('price_per_kg')} />
              <input className="input-field" placeholder="Kabupaten" onChange={setS('kabupaten')} />
              <input className="input-field" placeholder="Provinsi" onChange={setS('provinsi')} />

              <button className="btn-primary w-full" onClick={() => supplyMutation.mutate(supplyForm)}>
                Kirim
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= DEMAND ================= */}
        {activeTab === 'demand' && (
          <motion.div className="card max-w-lg mx-auto p-5">
            <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Target size={18} />
              Lapor Kebutuhan
            </h2>

            <div className="space-y-3">
              <select className="input-field" onChange={setD('komoditas_id')}>
                <option value="">Pilih komoditas...</option>
                {komoditasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>

              <input className="input-field" placeholder="Jumlah (kg)" type="number" onChange={setD('quantity_kg')} />
              <input className="input-field" placeholder="Max harga/kg" type="number" onChange={setD('max_price_per_kg')} />
              <input className="input-field" placeholder="Kabupaten" onChange={setD('kabupaten')} />
              <input className="input-field" placeholder="Provinsi" onChange={setD('provinsi')} />

              <button className="btn-primary w-full" onClick={() => demandMutation.mutate(demandForm)}>
                Kirim
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}