import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

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
  const [supplyForm, setSupplyForm] = useState({ komoditas_id: '', quantity_kg: '', price_per_kg: '', kabupaten: '', provinsi: '' });
  const [demandForm, setDemandForm] = useState({ komoditas_id: '', quantity_kg: '', max_price_per_kg: '', kabupaten: '', provinsi: '', needed_by: '' });

  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['matching-feed'],
    queryFn: () => api.get('/matching/feed').then(r => r.data),
  });

  const supplyMutation = useMutation({
    mutationFn: (data: typeof supplyForm) => api.post('/matching/supply', { ...data, quantity_kg: Number(data.quantity_kg), price_per_kg: Number(data.price_per_kg) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['matching-feed'] }); setActiveTab('feed'); },
  });

  const demandMutation = useMutation({
    mutationFn: (data: typeof demandForm) => api.post('/matching/demand', { ...data, quantity_kg: Number(data.quantity_kg), max_price_per_kg: Number(data.max_price_per_kg) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['matching-feed'] }); setActiveTab('feed'); },
  });

  const komoditasList: KomoditasItem[] = komoditasData?.data || [];
  const feed: MatchRecord[] = feedData?.data || [];
  const setS = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setSupplyForm(f => ({ ...f, [k]: e.target.value }));
  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDemandForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-900">🔗 Matching Demand-Supply</h1>
        <p className="text-sm text-green-600 mt-1">Lapor surplus stok atau kebutuhan komoditas — sistem cocokkan otomatis berdasarkan wilayah & harga</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-green-50 rounded-xl p-1 mb-6 w-fit gap-1">
        {[{ key: 'feed', label: `📋 Feed (${feed.length})` }, { key: 'supply', label: '📦 Lapor Stok' }, { key: 'demand', label: '🎯 Lapor Kebutuhan' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-green-800 shadow-sm' : 'text-green-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' && (
          <motion.div key="feed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {feedLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-24 bg-green-50" />)}</div>
            ) : feed.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="font-bold text-green-900 mb-2">Belum ada matching aktif</h3>
                <p className="text-sm text-green-600 mb-4">Lapor surplus atau kebutuhan komoditas agar sistem dapat mencocokkan.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setActiveTab('supply')} className="btn-primary text-sm">📦 Lapor Stok Surplus</button>
                  <button onClick={() => setActiveTab('demand')} className="btn-secondary text-sm">🎯 Lapor Kebutuhan</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((m: MatchRecord, i: number) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-green-900 text-base">{m.komoditas_nama}</div>
                        <div className="text-sm text-green-600 mt-1">
                          <span className="badge badge-green mr-2">📦 Surplus: {m.supply_kabupaten}, {m.supply_provinsi}</span>
                          <span className="badge badge-amber">🎯 Butuh: {m.demand_kabupaten}, {m.demand_provinsi}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-sm font-bold text-green-700">
                          Rp{Number(m.suggested_price).toLocaleString('id-ID')}/kg
                        </div>
                        <div className="text-xs text-green-500">{m.quantity_matched} kg</div>
                        <span className={`badge mt-1 text-[10px] ${m.match_score >= 80 ? 'badge-green' : m.match_score >= 60 ? 'badge-amber' : 'badge-blue'}`}>
                          ⚡ Skor {m.match_score}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'supply' && (
          <motion.div key="supply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card max-w-lg">
            <h2 className="font-bold text-green-900 mb-4">📦 Lapor Surplus Stok</h2>
            <div className="space-y-3">
              <select className="input-field text-sm" value={supplyForm.komoditas_id} onChange={setS('komoditas_id')}>
                <option value="">Pilih komoditas...</option>
                {komoditasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
              <input className="input-field text-sm" placeholder="Jumlah (kg)" type="number" value={supplyForm.quantity_kg} onChange={setS('quantity_kg')} />
              <input className="input-field text-sm" placeholder="Harga jual/kg (Rp)" type="number" value={supplyForm.price_per_kg} onChange={setS('price_per_kg')} />
              <input className="input-field text-sm" placeholder="Kabupaten" value={supplyForm.kabupaten} onChange={setS('kabupaten')} />
              <input className="input-field text-sm" placeholder="Provinsi" value={supplyForm.provinsi} onChange={setS('provinsi')} />
              <button
                onClick={() => supplyMutation.mutate(supplyForm)}
                className="btn-primary w-full justify-center disabled:opacity-50"
                disabled={supplyMutation.isPending || !supplyForm.komoditas_id || !supplyForm.quantity_kg}
              >
                {supplyMutation.isPending ? '⏳ Menyimpan...' : '✅ Lapor Surplus Stok'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'demand' && (
          <motion.div key="demand" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card max-w-lg">
            <h2 className="font-bold text-green-900 mb-4">🎯 Lapor Kebutuhan</h2>
            <div className="space-y-3">
              <select className="input-field text-sm" value={demandForm.komoditas_id} onChange={setD('komoditas_id')}>
                <option value="">Pilih komoditas yang dibutuhkan...</option>
                {komoditasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
              <input className="input-field text-sm" placeholder="Jumlah dibutuhkan (kg)" type="number" value={demandForm.quantity_kg} onChange={setD('quantity_kg')} />
              <input className="input-field text-sm" placeholder="Harga maks/kg (Rp)" type="number" value={demandForm.max_price_per_kg} onChange={setD('max_price_per_kg')} />
              <input className="input-field text-sm" placeholder="Kota/Kabupaten tujuan" value={demandForm.kabupaten} onChange={setD('kabupaten')} />
              <input className="input-field text-sm" placeholder="Provinsi" value={demandForm.provinsi} onChange={setD('provinsi')} />
              <input className="input-field text-sm" type="date" placeholder="Dibutuhkan sebelum" value={demandForm.needed_by} onChange={setD('needed_by')} />
              <button
                onClick={() => demandMutation.mutate(demandForm)}
                className="btn-primary w-full justify-center disabled:opacity-50"
                disabled={demandMutation.isPending || !demandForm.komoditas_id || !demandForm.quantity_kg}
              >
                {demandMutation.isPending ? '⏳ Menyimpan...' : '✅ Lapor Kebutuhan'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
