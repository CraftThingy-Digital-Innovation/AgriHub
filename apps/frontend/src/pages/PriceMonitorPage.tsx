import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';

interface PriceRecord {
  recorded_date: string;
  price_per_kg: number;
  kabupaten: string;
  provinsi: string;
  komoditas_nama?: string;
}

interface PredictedPrice {
  date: string;
  predicted_price: number;
}

interface KomoditasItem {
  id: string;
  nama: string;
  kategori: string;
}

export default function PriceMonitorPage() {
  const [selectedKomoditas, setSelectedKomoditas] = useState('');
  const [showPredict, setShowPredict] = useState(false);
  const qc = useQueryClient();

  // Fetch komoditas list
  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  // Fetch latest prices
  const { data: priceData } = useQuery({
    queryKey: ['prices-latest', selectedKomoditas],
    queryFn: () => api.get(`/price/latest${selectedKomoditas ? `?komoditas_id=${selectedKomoditas}&limit=100` : '?limit=50'}`).then(r => r.data),
  });

  // Fetch history for chart
  const { data: historyData } = useQuery({
    queryKey: ['price-history', selectedKomoditas],
    queryFn: () => api.get(`/price/history/${selectedKomoditas}`).then(r => r.data),
    enabled: !!selectedKomoditas,
  });

  // Fetch AI prediction
  const { data: predictData, isFetching: isPredicting } = useQuery({
    queryKey: ['price-predict', selectedKomoditas],
    queryFn: () => api.get(`/price/predict/${selectedKomoditas}`).then(r => r.data),
    enabled: !!selectedKomoditas && showPredict,
    staleTime: 6 * 60 * 60 * 1000, // 6 jam
  });

  // Report price mutation
  const reportMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/price/report', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices-latest'] }),
  });

  // Prepare chart data
  const chartData = [
    ...(historyData?.data || []).map((h: PriceRecord) => ({ date: h.recorded_date, actual: h.price_per_kg })),
    ...(showPredict && predictData?.data ? (predictData.data as PredictedPrice[]).map(p => ({ date: p.date, prediksi: p.predicted_price })) : []),
  ];

  const komoditasList: KomoditasItem[] = komoditasData?.data || [];
  const latestPrices: PriceRecord[] = priceData?.data || [];

  // Group by komoditas untuk summary
  const summaryMap: Record<string, PriceRecord[]> = {};
  for (const p of latestPrices) {
    const key = p.komoditas_nama || 'Lainnya';
    if (!summaryMap[key]) summaryMap[key] = [];
    summaryMap[key].push(p);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-900">📈 Monitor Harga Pangan</h1>
          <p className="text-sm text-green-600 mt-1">Pantau harga komoditas & prediksi AI 2 minggu ke depan</p>
        </div>
        <select
          className="input-field w-52 text-sm"
          value={selectedKomoditas}
          onChange={e => { setSelectedKomoditas(e.target.value); setShowPredict(false); }}
        >
          <option value="">-- Pilih Komoditas --</option>
          {komoditasList.map((k: KomoditasItem) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </div>

      {/* Chart + Predict */}
      {selectedKomoditas && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-green-900">Grafik Harga (30 Hari)</h2>
            <button
              onClick={() => setShowPredict(!showPredict)}
              className={showPredict ? 'btn-primary text-xs py-1.5 px-3' : 'btn-secondary text-xs py-1.5 px-3'}
            >
              {isPredicting ? '⏳ Prediksi AI...' : showPredict ? '🔮 Prediksi Aktif' : '🔮 Aktifkan Prediksi AI'}
            </button>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5ed" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5a7060' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#5a7060' }} tickFormatter={v => `Rp${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v, name) => [`Rp${Number(v).toLocaleString('id-ID')}/kg`, name === 'actual' ? 'Aktual' : 'Prediksi']} labelFormatter={l => `Tanggal: ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 2 }} name="Harga Aktual" />
                {showPredict && <Line type="monotone" dataKey="prediksi" stroke="#f5c242" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} name="Prediksi AI" />}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-green-500 text-sm">Belum ada data harga untuk komoditas ini. Laporkan harga pertama!</div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Price Summary Grid */}
        <div className="card">
          <h2 className="font-bold text-green-900 mb-4">💰 Harga Terkini (Nasional)</h2>
          {latestPrices.length === 0 ? (
            <div className="text-center py-8 text-green-500 text-sm">
              <div className="text-3xl mb-2">📊</div>
              <p>Belum ada data harga. Jadilah yang pertama laporkan!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.entries(summaryMap).slice(0, 15).map(([nama, records]) => {
                const avgPrice = records.reduce((s, r) => s + r.price_per_kg, 0) / records.length;
                return (
                  <div key={nama} className="flex items-center justify-between p-2 rounded-lg hover:bg-green-50">
                    <div className="text-sm font-medium text-green-900">{nama}</div>
                    <div className="text-sm font-bold text-green-700">Rp{Math.round(avgPrice).toLocaleString('id-ID')}/kg</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Harga */}
        <div className="card">
          <h2 className="font-bold text-green-900 mb-4">📝 Lapor Harga Pasar</h2>
          <p className="text-xs text-green-600 mb-3">Bantu petani lain dengan melaporkan harga di pasar terdekat Anda.</p>
          <ReportPriceForm komoditasList={komoditasList} onSubmit={(data) => reportMutation.mutate(data)} loading={reportMutation.isPending} />
        </div>
      </div>
    </div>
  );
}

function ReportPriceForm({ komoditasList, onSubmit, loading }: { komoditasList: KomoditasItem[]; onSubmit: (d: Record<string, unknown>) => void; loading: boolean }) {
  const [form, setForm] = useState({ komoditas_id: '', price_per_kg: '', kabupaten: '', provinsi: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-2">
      <select className="input-field text-sm" value={form.komoditas_id} onChange={set('komoditas_id')}>
        <option value="">Pilih komoditas...</option>
        {komoditasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
      </select>
      <input className="input-field text-sm" placeholder="Harga per kg (Rp)" type="number" value={form.price_per_kg} onChange={set('price_per_kg')} />
      <input className="input-field text-sm" placeholder="Kabupaten" value={form.kabupaten} onChange={set('kabupaten')} />
      <input className="input-field text-sm" placeholder="Provinsi" value={form.provinsi} onChange={set('provinsi')} />
      <button
        onClick={() => onSubmit({ ...form, price_per_kg: Number(form.price_per_kg) })}
        className="btn-primary w-full justify-center text-sm disabled:opacity-50"
        disabled={loading || !form.komoditas_id || !form.price_per_kg}
      >
        {loading ? '⏳ Menyimpan...' : '📊 Lapor Harga'}
      </button>
    </div>
  );
}
