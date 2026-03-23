export default function PriceMonitorPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-green-900 mb-2">📈 Monitor Harga Pangan</h1>
      <p className="text-sm text-green-600 mb-6">Dashboard real-time harga komoditas nasional + prediksi AI 2 minggu ke depan.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card h-64 flex items-center justify-center text-center">
          <div>
            <div className="text-4xl mb-3">📊</div>
            <p className="text-green-700 font-medium">Chart Harga Recharts</p>
            <p className="text-sm text-green-500 mt-1">Tersedia di Sprint 4</p>
          </div>
        </div>
        <div className="card h-64 flex items-center justify-center text-center">
          <div>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-green-700 font-medium">Peta Distribusi Leaflet</p>
            <p className="text-sm text-green-500 mt-1">Tersedia di Sprint 4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
