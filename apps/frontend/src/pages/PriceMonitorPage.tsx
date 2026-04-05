import { useState, useEffect } from 'react';
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

export default function PriceMonitorPage() {
  // ── PIHPS Map filters (plain-text nama komoditas, bukan UUID) ──────────────
  const [selectedPihpsCommodity, setSelectedPihpsCommodity] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Akan di-set ke latest date via API
  const [selectedMarketType, setSelectedMarketType] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedProvDetail, setSelectedProvDetail] = useState<{prov: string; price: number} | null>(null);

  // ── AgriHub local chart (terpisah untuk prediksi AI) ──────────────────────
  const [selectedKomoditas, setSelectedKomoditas] = useState('');
  const [showPredict, setShowPredict] = useState(false);

  const qc = useQueryClient();

  // Komoditas dari PIHPS (plain text) — untuk dropdown filter peta
  const { data: pihpsCommoditiesData } = useQuery({
    queryKey: ['pihps-commodities'],
    queryFn: () => api.get('/pihps/commodities').then(r => r.data),
    staleTime: 1000 * 60 * 60,
  });

  // Ambil tanggal max dari data PIHPS untuk default kalender
  const { data: latestDateData } = useQuery({
    queryKey: ['pihps-latest-date'],
    queryFn: () => api.get('/pihps/latest-date').then(r => r.data),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (latestDateData?.date && !selectedDate) {
      setSelectedDate(String(latestDateData.date).slice(0, 10));
    }
  }, [latestDateData, selectedDate]);

  // Komoditas AgriHub — untuk chart lokal & prediksi
  const { data: komoditasData } = useQuery({
    queryKey: ['komoditas-list'],
    queryFn: () => api.get('/products/komoditas/list').then(r => r.data),
  });

  const { data: priceData } = useQuery({
    queryKey: ['prices-latest', selectedKomoditas],
    queryFn: () =>
      api.get(`/price/latest${selectedKomoditas ? `?komoditas_id=${selectedKomoditas}` : ''}`).then(r => r.data),
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

  // Data peta PIHPS — plain text commodity name
  const { data: mapDataRaw } = useQuery({
    queryKey: ['pihps-map-data', selectedPihpsCommodity, selectedDate, selectedMarketType],
    queryFn: () => {
      const p = new URLSearchParams();
      if (selectedPihpsCommodity) p.append('commodity', selectedPihpsCommodity);
      if (selectedDate) p.append('date', selectedDate);
      if (selectedMarketType) p.append('marketType', selectedMarketType);
      return api.get(`/pihps/map-data?${p.toString()}`).then(r => r.data);
    },
  });

  const reportMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/price/report', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prices-latest'] }),
  });

  const pihpsCommodities: string[] = pihpsCommoditiesData?.data || [];
  const komoditasList: {id: string; nama: string}[] = komoditasData?.data || [];
  const latestPrices: PriceRecord[] = priceData?.data || [];

  const chartData = [
    ...(historyData?.data || []).map((h: PriceRecord) => ({
      date: h.recorded_date,
      actual: h.price_per_kg,
    })),
    ...(showPredict && predictData?.data
      ? (predictData.data as PredictedPrice[]).map(p => ({
          date: p.date,
          prediksi: p.predicted_price,
        }))
      : []),
  ];

  // Aggregate map data by province (average price across all commodity sub-variants)
  const provList: {prov: string; avg: number}[] = (() => {
    const mapItems: {prov_name: string; aggregate_price: number}[] = mapDataRaw?.data || [];
    const byProv: Record<string, number[]> = {};
    mapItems.forEach((item: any) => {
      if (!byProv[item.prov_name]) byProv[item.prov_name] = [];
      byProv[item.prov_name].push(Number(item.aggregate_price));
    });
    return Object.entries(byProv)
      .map(([prov, prices]) => ({
        prov,
        avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      }))
      .sort((a, b) => a.avg - b.avg);
  })();

  const minPrice = provList.length > 0 ? provList[0].avg : 0;
  const maxPrice = provList.length > 0 ? provList[provList.length - 1].avg : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <BarChart3 className="text-green-600" size={24} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-green-900 leading-tight">Monitor Harga Pangan</h1>
          <p className="text-xs md:text-sm text-green-600">Pantau harga komoditas nasional (PIHPS) &amp; lokal AgriHub</p>
        </div>
      </div>

      {/* ── PETA NASIONAL ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NationalPriceMap
            data={mapDataRaw?.data || []}
            selectedProvince={selectedProvince}
            onProvinceClick={(prov) => {
              setSelectedProvince(prov);
              const found = (mapDataRaw?.data || []).find((d: any) =>
                d.prov_name.toUpperCase().includes(prov)
              );
              setSelectedProvDetail({ prov, price: found ? Number(found.aggregate_price) : 0 });
            }}
          />
        </motion.div>

        {selectedProvDetail && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-bold text-green-900 text-lg">{selectedProvDetail.prov}</h3>
              <p className="text-sm text-green-600">
                {selectedPihpsCommodity ? `Rata-rata harga ${selectedPihpsCommodity}` : 'Rata-rata semua komoditas'}
              </p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {selectedProvDetail.price > 0
                ? `Rp${selectedProvDetail.price.toLocaleString('id-ID')}/Kg`
                : 'Data Tidak Tersedia'}
            </p>
          </div>
        )}

        {/* ── FILTER PANEL ────────────────────────────────────────────────── */}
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">KOMODITAS (PIHPS)</label>
            <select
              className="input-field w-full h-10 text-sm"
              value={selectedPihpsCommodity}
              onChange={e => {
                setSelectedPihpsCommodity(e.target.value);
                setSelectedProvDetail(null);
              }}
            >
              <option value="">Semua Komoditas / Pilih...</option>
              {pihpsCommodities.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">TANGGAL (PIHPS)</label>
            <input
               className="input-field w-full h-10 text-sm cursor-pointer px-2"
               type="text"
               placeholder="hari/bulan/tahun"
               onFocus={(e) => (e.target.type = 'date')}
               onBlur={(e) => {
                 if (!e.target.value) e.target.type = 'text';
               }}
               value={selectedDate}
               onChange={e => setSelectedDate(e.target.value)}
             />
          </div>

          <div className="flex-1 min-w-[160px]">
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
          <div className="flex-1 min-w-[160px]">
             <label className="block text-xs font-semibold text-gray-500 mb-1">PROVINSI (PETA)</label>
             <select
               className="input-field w-full h-10 text-sm"
               value={selectedProvince}
               onChange={e => {
                  const prov = e.target.value;
                  setSelectedProvince(prov);
                  if (prov) {
                      const found = (mapDataRaw?.data || []).find((d: any) =>
                        d.prov_name.toUpperCase().includes(prov)
                      );
                      setSelectedProvDetail({ prov: prov, price: found ? Number(found.aggregate_price) : 0 });
                  } else {
                      setSelectedProvDetail(null);
                  }
               }}
             >
               <option value="">Seluruh Indonesia / Pilih...</option>
               {Array.from(new Set((mapDataRaw?.data || []).map((x:any) => x.prov_name.toUpperCase()))).sort().map(p => (
                  <option key={p as string} value={p as string}>{p as string}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* ── SIDE BY SIDE: PIHPS NASIONAL vs AGRIHUB LOKAL ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT: Harga per Provinsi dari PIHPS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col">
          <h2 className="font-semibold text-green-900 mb-1 flex items-center gap-2">
            <BarChart3 size={18} className="text-green-600" />
            Harga Nasional (PIHPS)
            {selectedPihpsCommodity && (
              <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                {selectedPihpsCommodity}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mb-3">Rata-rata per provinsi · Sumber: Bank Indonesia / PIHPS</p>

          {provList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-green-500 text-sm text-center py-8 px-4">
              {selectedPihpsCommodity
                ? `Tidak ada data "${selectedPihpsCommodity}" untuk tanggal ini.`
                : 'Pilih komoditas di filter atas untuk melihat harga per provinsi.'}
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto max-h-96 pr-1">
              {provList.map(({ prov, avg }) => {
                const ratio = maxPrice === minPrice ? 0.5 : (avg - minPrice) / (maxPrice - minPrice);
                const bar = ratio < 0.33 ? 'bg-green-400' : ratio < 0.66 ? 'bg-yellow-400' : 'bg-red-400';
                return (
                  <div key={prov} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-gray-600 truncate text-xs">{prov}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${Math.max(8, ratio * 100)}%` }} />
                    </div>
                    <span className="shrink-0 font-semibold text-green-800 text-xs w-28 text-right">
                      Rp{avg.toLocaleString('id-ID')}/Kg
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* RIGHT: Chart Riwayat Lokal AgriHub */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h2 className="font-semibold text-green-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                Harga Lokal (AgriHub)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Berdasarkan transaksi aktif di platform</p>
            </div>
            <button
              onClick={() => setShowPredict(!showPredict)}
              className={`shrink-0 ${showPredict ? 'btn-primary' : 'btn-secondary'} text-xs`}
              disabled={!selectedKomoditas}
            >
              {showPredict ? '🔮 Aktif' : '🔮 Prediksi AI'}
            </button>
          </div>

          <select
            className="input-field w-full text-sm mb-3"
            value={selectedKomoditas}
            onChange={e => { setSelectedKomoditas(e.target.value); setShowPredict(false); }}
          >
            <option value="">— Pilih Komoditas AgriHub —</option>
            {komoditasList.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          {!selectedKomoditas ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
              <p className="text-sm text-green-600">Pilih komoditas untuk melihat riwayat &amp; prediksi harga lokal.</p>
              {latestPrices.length === 0 && (
                <p className="text-xs text-gray-400 max-w-xs">
                  Harga dihitung otomatis dari transaksi nyata.{' '}
                  <b>Mulailah bertransaksi di AgriHub!</b>
                </p>
              )}
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Harga Asli" stroke="#2D6A4F" dot={false} />
                {showPredict && (
                  <Line type="monotone" dataKey="prediksi" name="Prediksi AI" stroke="#f5c242" strokeDasharray="5 5" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-green-500 text-sm text-center py-8">
              Belum ada riwayat harga untuk komoditas ini di AgriHub.
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}