import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

type AdminTab = 'dashboard' | 'wa' | 'users' | 'rag' | 'komoditas' | 'migration';

interface User { id: string; name: string; phone: string; role: string; is_verified: number; created_at: string; }
interface RagDoc { id: string; title: string; source_type: string; is_global: number; chunk_count: number; created_at: string; }
interface Stats { users: number; orders: number; stores: number; products: number; ragDocs: number; revenue: number; recentOrders: Record<string, unknown>[]; usersByRole: { role: string; count: number }[]; }

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'wa', label: 'WhatsApp Bot', icon: '📱' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'rag', label: 'Dokumen AI', icon: '🧠' },
  { key: 'komoditas', label: 'Komoditas', icon: '🌾' },
  { key: 'migration', label: 'Migrasi DB', icon: '🗄️' },
];

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const qc = useQueryClient();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg font-bold shadow-md">⚙</div>
        <div>
          <h1 className="text-2xl font-bold text-green-900">Superadmin Panel</h1>
          <p className="text-xs text-green-500">Akses penuh ke sistem AgriHub Indonesia</p>
        </div>
        <div className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">🔒 ADMIN ONLY</div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-green-50 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all ${tab === t.key ? 'bg-white text-green-800 shadow-sm' : 'text-green-600 hover:text-green-800'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'wa' && <WATab />}
          {tab === 'users' && <UsersTab qc={qc} />}
          {tab === 'rag' && <RagTab qc={qc} />}
          {tab === 'komoditas' && <KomoditasTab qc={qc} />}
          {tab === 'migration' && <MigrationTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data.data as Stats) });
  if (isLoading) return <div className="text-center py-20 text-green-500">⏳ Loading stats...</div>;
  const s = data!;

  const statCards = [
    { label: 'Total Users', value: s.users.toLocaleString('id-ID'), icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Pesanan', value: s.orders.toLocaleString('id-ID'), icon: '📦', color: 'bg-amber-50 text-amber-700' },
    { label: 'Toko Aktif', value: s.stores.toLocaleString('id-ID'), icon: '🏪', color: 'bg-green-50 text-green-700' },
    { label: 'Produk Aktif', value: s.products.toLocaleString('id-ID'), icon: '🥬', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Dokumen AI', value: s.ragDocs.toLocaleString('id-ID'), icon: '🧠', color: 'bg-purple-50 text-purple-700' },
    { label: 'Revenue (Fee)', value: `Rp${s.revenue.toLocaleString('id-ID')}`, icon: '💰', color: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`card p-4 ${c.color}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs font-medium opacity-70">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* User by role chart */}
        <div className="card">
          <h3 className="font-bold text-green-900 mb-3">👥 User by Role</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={s.usersByRole}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8f5ed" />
              <XAxis dataKey="role" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent orders */}
        <div className="card">
          <h3 className="font-bold text-green-900 mb-3">📦 10 Pesanan Terbaru</h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {s.recentOrders.map((o: Record<string, unknown>) => (
              <div key={String(o.id)} className="flex items-center justify-between text-sm">
                <span className="text-green-800 truncate max-w-[160px]">{String(o.product_name)}</span>
                <span className={`badge text-xs ${o.status === 'selesai' ? 'badge-green' : o.status === 'dikirim' ? 'badge-blue' : 'badge-amber'}`}>{String(o.status)}</span>
                <span className="text-green-700 font-medium">Rp{Number(o.total_amount).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp Bot ──────────────────────────────────────────────────────────

function WATab() {
  const qc = useQueryClient();
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  
  const { data, refetch } = useQuery({
    queryKey: ['admin-wa'],
    queryFn: () => api.get('/admin/wa-status').then(r => r.data.data),
    refetchInterval: 3000, // cek setiap 3 detik
  });

  const connectMut = useMutation({
    mutationFn: () => api.post('/admin/wa-connect'),
    onSuccess: () => { setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-wa'] }), 2000); },
  });

  const pairingMut = useMutation({
    mutationFn: (phone: string) => api.post('/admin/wa-pairing-code', { phone }).then(r => r.data.data.code),
    onSuccess: (code) => {
      setPairingCode(code);
      qc.invalidateQueries({ queryKey: ['admin-wa'] });
    }
  });

  const status = data as { isConnected: boolean; hasQR: boolean; qrCode: string } | undefined;

  return (
    <div className="card max-w-lg mx-auto text-center py-8">
      <div className="text-5xl mb-4">{status?.isConnected ? '✅' : (status?.hasQR || pairingCode) ? '📱' : '⚪'}</div>
      <h2 className="font-bold text-green-900 text-xl mb-2">
        {status?.isConnected ? 'WhatsApp Bot Terhubung' : (status?.hasQR || pairingCode) ? 'Hubungkan Perangkat' : 'Bot Tidak Aktif'}
      </h2>
      <p className="text-sm text-green-600 mb-5">
        {status?.isConnected
          ? 'Bot aktif dan menerima pesan. Session tersimpan permanen.'
          : 'Gunakan QR Code atau Pairing Code untuk menghubungkan akun WhatsApp Bot.'}
      </p>

      {!status?.isConnected && (
        <div className="space-y-6 mb-8">
          {/* QR Code Option */}
          {status?.hasQR && (
            <div className="bg-white border-2 border-green-200 rounded-2xl p-6 inline-block shadow-sm">
              <p className="text-green-600 text-center text-sm font-semibold mb-4">Metode 1: Scan QR Code</p>
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={status.qrCode} size={200} level="M" includeMargin={false} />
              </div>
            </div>
          )}

          {/* Pairing Code Option */}
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100 max-w-sm mx-auto">
            <p className="text-green-800 text-sm font-bold mb-3">Metode 2: Pairing Code (Tanpa Kamera)</p>
            {pairingCode ? (
              <div className="space-y-3">
                <div className="text-3xl font-mono font-black tracking-[0.3em] text-green-700 bg-white p-4 rounded-xl border-2 border-green-400">
                  {pairingCode}
                </div>
                <p className="text-[10px] text-green-600 leading-tight">
                  Masukkan kode di atas pada HP Anda:<br/>
                  <b>WA → Perangkat Tertaut → Tautkan Perangkat → Tautkan dengan nomor telepon saja</b>
                </p>
                <button onClick={() => setPairingCode('')} className="text-[10px] text-green-400 underline italic">Gunakan nomor lain / QR</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input 
                  className="input-field text-center font-bold tracking-widest" 
                  placeholder="628xxxxxxxxxx" 
                  value={pairingPhone} 
                  onChange={e => setPairingPhone(e.target.value)}
                />
                <button 
                  onClick={() => pairingMut.mutate(pairingPhone)} 
                  disabled={pairingMut.isPending || !pairingPhone}
                  className="btn-primary w-full justify-center text-xs py-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {pairingMut.isPending ? '⏳ Meminta Kode...' : '⌨ Dapatkan Kode Pairing'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3">
        {!status?.isConnected && !status?.hasQR && !pairingCode && (
          <button onClick={() => connectMut.mutate()} disabled={connectMut.isPending}
            className="btn-primary disabled:opacity-50">
            {connectMut.isPending ? '⏳ Menghubungkan...' : '🔗 Aktifkan Bot'}
          </button>
        )}
        <button onClick={() => refetch()} className="btn-secondary">🔄 Refresh Status</button>
      </div>

      {status?.isConnected && (
        <div className="mt-5 text-left bg-green-50 rounded-xl p-4">
          <p className="text-sm font-bold text-green-800 mb-2">Commands aktif:</p>
          {['MENU', 'DAFTAR TOKO | nama | kab | prov', 'JUAL [produk] [harga] [stok]', 'STOK', 'PESANAN', 'ONGKIR [asal] [tujuan] [berat]', 'Teks bebas → AI'].map(cmd => (
            <div key={cmd} className="text-xs font-mono bg-white rounded px-2 py-1 mb-1 text-green-700">{cmd}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Users ─────────────────────────────────────────────────────────────────

function UsersTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users?q=${search}&limit=50`).then(r => r.data.data as User[]),
  });
  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const ROLES = ['petani', 'konsumen', 'distributor', 'admin'];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-green-900">👥 Manajemen User ({data?.length || 0})</h3>
        <input className="input-field text-sm w-48" placeholder="Cari nama/no HP..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-green-100 text-green-600 text-xs">
            <th className="text-left py-2">Nama</th><th className="text-left py-2">No HP</th>
            <th className="text-left py-2">Role</th><th className="text-left py-2">Bergabung</th><th className="py-2">Aksi</th>
          </tr></thead>
          <tbody>
            {(data || []).map((u: User) => (
              <tr key={u.id} className="border-b border-green-50 hover:bg-green-50">
                <td className="py-2 font-medium text-green-900">{u.name} {u.is_verified ? '✅' : ''}</td>
                <td className="py-2 text-green-600 font-mono text-xs">{u.phone}</td>
                <td className="py-2">
                  <select value={u.role} onChange={e => roleMut.mutate({ id: u.id, role: e.target.value })}
                    className="text-xs border border-green-200 rounded px-2 py-1 bg-white text-green-800">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="py-2 text-xs text-green-500">{u.created_at.slice(0, 10)}</td>
                <td className="py-2 text-center">
                  <button onClick={() => { if (confirm('Hapus user ini?')) deleteMut.mutate(u.id); }}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RAG Docs ─────────────────────────────────────────────────────────────

function RagTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { data } = useQuery({ queryKey: ['admin-rag'], queryFn: () => api.get('/admin/rag-docs').then(r => r.data.data as RagDoc[]) });
  const toggleMut = useMutation({
    mutationFn: ({ id, is_global }: { id: string; is_global: boolean }) => api.patch(`/admin/rag-docs/${id}/global`, { is_global }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-rag'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/rag-docs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-rag'] }),
  });

  return (
    <div className="card">
      <h3 className="font-bold text-green-900 mb-1">🧠 Dokumen Knowledge Base AI ({data?.length || 0})</h3>
      <p className="text-xs text-green-500 mb-4">Dokumen "Global" tersedia untuk semua user. "Private" hanya milik yang upload.</p>
      <div className="space-y-2">
        {(data || []).map((d: RagDoc) => (
          <div key={d.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-green-900 text-sm truncate">{d.title}</div>
              <div className="text-xs text-green-500">{d.source_type} · {d.chunk_count} chunks · {d.created_at.slice(0, 10)}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleMut.mutate({ id: d.id, is_global: !d.is_global })}
                className={`text-xs px-2 py-1 rounded-full font-semibold ${d.is_global ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {d.is_global ? '🌍 Global' : '🔒 Private'}
              </button>
              <button onClick={() => { if (confirm('Hapus dokumen?')) deleteMut.mutate(d.id); }}
                className="text-red-400 hover:text-red-600 text-sm">🗑</button>
            </div>
          </div>
        ))}
        {data?.length === 0 && <div className="text-center py-8 text-green-400 text-sm">Belum ada dokumen. Upload via halaman AI Chat.</div>}
      </div>
    </div>
  );
}

// ─── Komoditas ─────────────────────────────────────────────────────────────

function KomoditasTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ nama: '', kategori: '', satuan: 'kg', deskripsi: '' });
  const { data } = useQuery({ queryKey: ['admin-komoditas'], queryFn: () => api.get('/admin/komoditas').then(r => r.data.data) });
  const addMut = useMutation({
    mutationFn: (d: typeof form) => api.post('/admin/komoditas', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-komoditas'] }); setForm({ nama: '', kategori: '', satuan: 'kg', deskripsi: '' }); },
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card">
        <h3 className="font-bold text-green-900 mb-4">➕ Tambah Komoditas</h3>
        <div className="space-y-2">
          <input className="input-field text-sm" placeholder="Nama komoditas" value={form.nama} onChange={set('nama')} />
          <input className="input-field text-sm" placeholder="Kategori (Sayuran, Buah, dll)" value={form.kategori} onChange={set('kategori')} />
          <select className="input-field text-sm" value={form.satuan} onChange={set('satuan')}>
            {['kg', 'gram', 'ikat', 'buah', 'liter', 'ton', 'karung'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input className="input-field text-sm" placeholder="Deskripsi (opsional)" value={form.deskripsi} onChange={set('deskripsi')} />
          <button onClick={() => addMut.mutate(form)} disabled={addMut.isPending || !form.nama || !form.kategori}
            className="btn-primary w-full justify-center disabled:opacity-50">
            {addMut.isPending ? '⏳...' : '✅ Tambah Komoditas'}
          </button>
        </div>
      </div>
      <div className="card">
        <h3 className="font-bold text-green-900 mb-3">🌾 Daftar Komoditas ({(data as unknown[])?.length || 0})</h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {(data as Record<string, unknown>[] || []).map((k: Record<string, unknown>) => (
            <div key={String(k.id)} className="flex justify-between items-center text-sm py-1 border-b border-green-50">
              <span className="font-medium text-green-900">{String(k.nama)}</span>
              <span className="text-xs text-green-500">{String(k.kategori)} · {String(k.satuan)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Migration ─────────────────────────────────────────────────────────────

function MigrationTab() {
  const [result, setResult] = useState<{ message: string; migrations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    try {
      const res = await api.post('/admin/run-migration');
      setResult(res.data.data);
    } catch (err: unknown) {
      setResult({ message: (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error', migrations: [] });
    } finally { setLoading(false); }
  };

  return (
    <div className="card max-w-lg">
      <h3 className="font-bold text-green-900 mb-2">🗄️ Database Migration Runner</h3>
      <p className="text-sm text-green-600 mb-4">Jalankan semua pending migrations. Aman untuk dijalankan berulang kali — hanya yang belum dijalankan yang akan dieksekusi.</p>

      <button onClick={runMigration} disabled={loading} className="btn-primary mb-5 disabled:opacity-50">
        {loading ? '⏳ Migrating...' : '▶️ Jalankan Migration'}
      </button>

      {result && (
        <div className={`rounded-xl p-4 text-sm ${result.migrations?.length === 0 && result.message?.includes('up to date') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          <div className="font-bold mb-2">✅ {result.message}</div>
          {result.migrations?.length > 0 && (
            <div className="space-y-1">
              {result.migrations.map((m: string) => <div key={m} className="font-mono text-xs">↳ {m}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
