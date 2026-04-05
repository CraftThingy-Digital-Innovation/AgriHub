import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  BarChart3,
  ClipboardEdit
} from "lucide-react";
import api from '../lib/api';
import NationalPriceMap from '../components/NationalPriceMap';

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

  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  const { data: priceData } = useQuery({
    queryKey: ['prices-latest', selectedKomoditas],
    queryFn: () =>
      api.get(`/price/latest${selectedKomoditas ? `?komoditas_id=${selectedKomoditas}` : ''}`)
        .then(r => r.data),
  });

  const { data: historyData } = useQuery({
    queryKey: ['price-history', selectedKomoditas],
    queryFn: () => api.get(`/price/history/${selectedKomoditas}`).then(r => r.data),
    enabled: !!selectedKomoditas,
  });

  const { data: predictData } = useQuery({
    queryKey: ['price-predict', selectedKomoditas],
    queryFn: () => api.get(`/price/predict/${selectedKomoditas}`).then(r => r.data),
    enabled: !!selectedKomoditas && showPredict,
  });

  const { data: mapDataRaw } = useQuery({
    queryKey: ['pihps-map-data', selectedKomoditas],
    queryFn: () => api.get(`/pihps/map-data${selectedKomoditas ? `?commodity=${selectedKomoditas}` : ''}`).then(r => r.data),
  });

  const reportMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/price/report', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices-latest'] }),
  });

  const komoditasList: KomoditasItem[] = komoditasData?.data || [];
  const latestPrices: PriceRecord[] = priceData?.data || [];

  const chartData = [
    ...(historyData?.data || []).map((h: PriceRecord) => ({
      date: h.recorded_date,
      actual: h.price_per_kg
    })),
    ...(showPredict && predictData?.data
      ? (predictData.data as PredictedPrice[]).map(p => ({
          date: p.date,
          prediksi: p.predicted_price
        }))
      : [])
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* 🔥 HEADER FIX TOTAL */}
      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div className="flex items-center gap-3">
          <BarChart3 className="text-green-600" size={24} />

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-green-900 leading-tight">
              Monitor Harga Pangan
            </h1>
            <p className="text-xs md:text-sm text-green-600">
              Pantau harga komoditas & prediksi AI
            </p>
          </div>
        </div>

        {/* 🔥 DROPDOWN DIPERKECIL */}
        <select
          className="input-field w-40 md:w-52 h-10 text-sm"
          value={selectedKomoditas}
          onChange={(e) => {
            setSelectedKomoditas(e.target.value);
            setShowPredict(false);
          }}
        >
          <option value="">Pilih Komoditas</option>
          {komoditasList.map(k => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>

      </div>

      {/* 🔥 NATIONAL PRICE MAP */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <NationalPriceMap data={mapDataRaw?.data || []} onProvinceClick={(prov) => console.log('Clicked:', prov)} />
      </motion.div>

      {/* 🔥 CHART LOKAL AGRIHUB */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-green-900">Riwayat Harga Lokal (AgriHub)</h2>

          <button
            onClick={() => setShowPredict(!showPredict)}
            className={showPredict ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
            disabled={!selectedKomoditas}
          >
            {showPredict ? '🔮 Aktif' : '🔮 Prediksi'}
          </button>
        </div>

        {!selectedKomoditas ? (
          <div className="text-center py-10 text-green-500">
            Silakan pilih komoditas di atas untuk melihat riwayat harga lokal.
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Harga Asli" stroke="#2D6A4F" />
              {showPredict && <Line type="monotone" dataKey="prediksi" name="Prediksi AI" stroke="#f5c242" />}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-green-500">
            Belum ada riwayat harga dilaporkan untuk komoditas ini.
          </div>
        )}
      </motion.div>

      {/* 🔥 GRID FIX RAPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 🔹 LEFT CARD */}
        <div className="card flex flex-col">

          <h2 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-green-600" />
            Harga Terkini (Nasional)
          </h2>

          {latestPrices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-green-500 text-sm">
              Belum ada data harga
            </div>
          ) : (
            <div className="space-y-2">
              {latestPrices.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{p.komoditas_nama}</span>
                  <span className="font-semibold text-green-700">
                    Rp{p.price_per_kg.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔹 RIGHT CARD */}
        <div className="card bg-green-50/50 flex flex-col justify-center items-center text-center p-8 border border-green-100">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <BarChart3 className="text-green-700 w-8 h-8" />
          </div>
          <h2 className="font-bold text-lg text-green-900 mb-2">
            Otomatisasi Harga AgriHub
          </h2>
          <p className="text-sm text-green-700 leading-relaxed max-w-sm">
            Harga lokal AgriHub langsung dikalkulasi mendengarkan setiap <b>transaksi riil</b> 
            dan penawaran aktif di Marketplace secara waktu-nyata.
            <br/><br/>
            Jadilah bagian dari transparansi pangan: <b>Mulailah bertransaksi di AgriHub!</b>
          </p>
        </div>

      </div>
    </div>
  );
}