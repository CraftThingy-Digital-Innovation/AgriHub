export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-green-900 mb-2">🤖 AI Chat — Konsultan Pertanian</h1>
      <p className="text-sm text-green-600 mb-6">Tanya apa saja seputar pertanian, harga, penyakit tanaman, dan teknik budidaya. Didukung RAG dari dokumen pertanian Indonesia.</p>
      <div className="card h-[500px] flex flex-col">
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-green-700 font-medium">AI Chat akan tersedia di Sprint 2</p>
            <p className="text-sm text-green-500 mt-2">Menggunakan Puter.js SDK + RAG Engine</p>
          </div>
        </div>
        <div className="border-t border-green-100 p-4 flex gap-3">
          <input className="input-field flex-1 text-sm" placeholder="Tanya sesuatu tentang pertanian..." disabled />
          <button className="btn-primary py-2 px-5 text-sm opacity-50" disabled>Kirim</button>
        </div>
      </div>
    </div>
  );
}
