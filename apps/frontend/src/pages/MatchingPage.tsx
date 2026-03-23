export default function MatchingPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-green-900 mb-2">🔗 Matching Demand-Supply</h1>
      <p className="text-sm text-green-600 mb-6">Lapor surplus stok atau kebutuhan komoditas, dan sistem akan mencocokkan secara otomatis.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="font-bold text-green-900 mb-4">📦 Lapor Stok Surplus</h2>
          <div className="space-y-3">
            <input className="input-field text-sm" placeholder="Komoditas (mis: Jagung)" disabled />
            <input className="input-field text-sm" placeholder="Jumlah (kg)" disabled />
            <input className="input-field text-sm" placeholder="Harga/kg (Rp)" disabled />
            <input className="input-field text-sm" placeholder="Kota" disabled />
            <button className="btn-primary w-full justify-center opacity-50 text-sm" disabled>Lapor Stok (Sprint 4)</button>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-green-900 mb-4">🎯 Lapor Kebutuhan</h2>
          <div className="space-y-3">
            <input className="input-field text-sm" placeholder="Komoditas yang dibutuhkan" disabled />
            <input className="input-field text-sm" placeholder="Jumlah (kg)" disabled />
            <input className="input-field text-sm" placeholder="Harga maks/kg (Rp)" disabled />
            <input className="input-field text-sm" placeholder="Kota tujuan" disabled />
            <button className="btn-primary w-full justify-center opacity-50 text-sm" disabled>Lapor Kebutuhan (Sprint 4)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
