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
import { BarChart3 } from 'lucide-react';
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
  // State PIHPS Map filters (pakai plain-text nama komoditas, bukan UUID)
  const [selectedPihpsCommodity, setSelectedPihpsCommodity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMarketType, setSelectedMarketType] = useState('');
  const [selectedProvDetail, setSelectedProvDetail] = useState<{prov: string, price: number} | null>(null);

  // State AgriHub local chart (tetap terpisah untuk prediksi AI)
  const [selectedKomoditas, setSelectedKomoditas] = useState('');
  const [showPredict, setShowPredict] = useState(false);

  const qc = useQueryClient();

  // Daftar komoditas PIHPS (plain text) — untuk dropdown filter peta
  const { data: pihpsCommoditiesData } = useQuery({
    queryKey: ['pihps-commodities'],
    queryFn: () => api.get('/pihps/commodities').then(r => r.data),
    staleTime: 1000 * 60 * 60, // Cache 1 jam
  });

  // Daftar komoditas AgriHub — untuk chart lokal & prediksi AI
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

  // Data peta PIHPS — gunakan selectedPihpsCommodity (plain text)
  const { data: mapDataRaw } = useQuery({
    queryKey: ['pihps-map-data', selectedPihpsCommodity, selectedDate, selectedMarketType],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (selectedPihpsCommodity) queryParams.append('commodity', selectedPihpsCommodity);
      if (selectedDate) queryParams.append('date', selectedDate);
      if (selectedMarketType) queryParams.append('marketType', selectedMarketType);
      return api.get(`/pihps/map-data?${queryParams.toString()}`).then(r => r.data);
    },
  });

  const reportMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/price/report', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices-latest'] }),
  });

  const pihpsCommodities: string[] = pihpsCommoditiesData?.data || [];
  const komoditasList = komoditasData?.data || [];
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

      </div>

      <div className="flex flex-col mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <NationalPriceMap 
                data={mapDataRaw?.data || []} 
                onProvinceClick={(prov) => {
                    const found = (mapDataRaw?.data || []).find((d: any) => d.prov_name.toUpperCase().includes(prov));
                    setSelectedProvDetail({ prov, price: found ? found.aggregate_price : 0 });
                }} 
            />
          </motion.div>
          
          {selectedProvDetail && (
             <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="font-bold text-green-900 text-lg">{selectedProvDetail.prov}</h3>
                    <p className="text-sm text-green-700">Data Peta Terbaru</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                        {selectedProvDetail.price > 0 ? `Rp${selectedProvDetail.price.toLocaleString('id-ID')}/Kg` : 'Data Tidak Tersedia'}
                    </p>
                </div>
             </div>
          )}

          {/* 🔥 FILTER PANEL UNTUK MAP PIHPS & AGRIHUB */}
          <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">KOMODITAS</label>
                <select
                  className="input-field w-full h-10 text-sm"
                  value={selectedPihpsCommodity}
                  onChange={(e) => {
                    setSelectedPihpsCommodity(e.target.value);
                    setSelectedProvDetail(null);
                  }}
                >
                  <option value="">Semua Komoditas / Pilih...</option>
                  {pihpsCommodities.map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">TANGGAL (PIHPS)</label>
                <input 
                    type="date" 
                    className="input-field w-full h-10 text-sm" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                />
            </div>

            <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-500 mb-1">TIPE PASAR (PIHPS)</label>
                <select 
                    className="input-field w-full h-10 text-sm"
                    value={selectedMarketType}
                    onChange={e => setSelectedMarketType(e.target.value)}
                >
                    <option value="">Semua Pasar</option>
                    <option value="1">Pasar Tradisional</option>
                    <option value="2">Pasar Modern</option>
                    <option value="3">Pasar Grosir</option>
                    <option value="4">Pasar Produsen</option>
                </select>
            </div>
          </div>
      </div>

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