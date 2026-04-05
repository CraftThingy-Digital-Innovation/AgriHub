import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Settings, ShieldAlert, LayoutDashboard, MessageSquare, 
  Users, BrainCircuit, Sprout, Database, Package, 
  Store, Leaf, BadgeDollarSign, Activity, CheckCircle2, 
  Smartphone, Trash2, Globe, Lock, Search, Plus, Play, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { useModalStore } from '../store/useModalStore';

type AdminTab = 'dashboard' | 'wa' | 'users' | 'rag' | 'komoditas' | 'migration' | 'settings';

interface User { id: string; name: string; phone: string; role: string; is_verified: number; created_at: string; }
interface RagDoc { id: string; title: string; source_type: string; is_global: number; chunk_count: number; created_at: string; }
interface Stats { users: number; orders: number; stores: number; products: number; ragDocs: number; revenue: number; recentOrders: Record<string, unknown>[]; usersByRole: { role: string; count: number }[]; }

const TABS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'wa', label: 'WhatsApp Bot', icon: MessageSquare },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'rag', label: 'Dokumen AI', icon: BrainCircuit },
  { key: 'komoditas', label: 'Komoditas', icon: Sprout },
  { key: 'migration', label: 'Migrasi DB', icon: Database },
  { key: 'settings', label: 'Pengaturan', icon: Settings },
];

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const qc = useQueryClient();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Superadmin Panel</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Akses penuh ke sistem AgriHub Indonesia</p>
        </div>
        <div className="ml-auto px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold tracking-wide rounded-full flex items-center gap-1.5 uppercase">
          <ShieldAlert className="w-3.5 h-3.5" />
          Admin Only
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100/80 rounded-2xl p-1.5 mb-8 border border-gray-200/50">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-green-700 shadow-sm ring-1 ring-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'wa' && <WATab />}
          {tab === 'users' && <UsersTab qc={qc} />}
          {tab === 'rag' && <RagTab qc={qc} />}
          {tab === 'komoditas' && <KomoditasTab qc={qc} />}
          {tab === 'migration' && <MigrationTab />}
          {tab === 'settings' && <SettingsPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Reusable Card Component ────────────────────────────────────────────────
const Card = ({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${className}`}>
    {title && <h3 className="font-bold text-gray-800 mb-4">{title}</h3>}
    {children}
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data.data as Stats) });
  
  if (isLoading || !data) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
      <Activity className="w-8 h-8 animate-pulse text-green-500" />
      <span className="text-sm font-medium">Memuat statistik...</span>
    </div>
  );
  
  const s = data;

  const statCards = [
    { label: 'Total Users', value: s.users.toLocaleString('id-ID'), icon: Users, color: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
    { label: 'Total Pesanan', value: s.orders.toLocaleString('id-ID'), icon: Package, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
    { label: 'Toko Aktif', value: s.stores.toLocaleString('id-ID'), icon: Store, color: 'bg-green-50 text-green-600', ring: 'ring-green-100' },
    { label: 'Produk Aktif', value: s.products.toLocaleString('id-ID'), icon: Leaf, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
    { label: 'Dokumen AI', value: s.ragDocs.toLocaleString('id-ID'), icon: BrainCircuit, color: 'bg-purple-50 text-purple-600', ring: 'ring-purple-100' },
    { label: 'Revenue (Fee)', value: `Rp${s.revenue.toLocaleString('id-ID')}`, icon: BadgeDollarSign, color: 'bg-rose-50 text-rose-600', ring: 'ring-rose-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ring-1 ${c.ring} ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User by role chart */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">User berdasarkan Role</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.usersByRole} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="role" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent orders */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">10 Pesanan Terbaru</h3>
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {s.recentOrders.map((o: Record<string, unknown>, i) => (
              <div key={String(o.id) || i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-semibold text-gray-900 truncate">{String(o.product_name)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">ID: #{String(o.id).slice(0,8)}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-900">Rp{Number(o.total_amount).toLocaleString('id-ID')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide
                    ${o.status === 'selesai' ? 'bg-green-100 text-green-700' : 
                      o.status === 'dikirim' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {String(o.status)}
                  </span>
                </div>
              </div>
            ))}
            {s.recentOrders.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">Belum ada pesanan</div>
            )}
          </div>
        </Card>
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
    refetchInterval: 3000,
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
    <Card className="max-w-2xl mx-auto text-center py-10">
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${status?.isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {status?.isConnected ? <CheckCircle2 className="w-10 h-10" /> : <Smartphone className="w-10 h-10" />}
        </div>
      </div>
      
      <h2 className="font-bold text-gray-900 text-2xl mb-2">
        {status?.isConnected ? 'WhatsApp Bot Aktif' : (status?.hasQR || pairingCode) ? 'Hubungkan Perangkat' : 'Bot Tidak Aktif'}
      </h2>
      <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
        {status?.isConnected
          ? 'Bot saat ini sedang berjalan dan siap membalas pesan secara otomatis. Sesi tersimpan aman.'
          : 'Gunakan QR Code atau Pairing Code untuk menyambungkan nomor WhatsApp ke sistem bot AgriHub.'}
      </p>

      {!status?.isConnected && (
        <div className="space-y-8 mb-8">
          {/* QR Code Option */}
          {status?.hasQR && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 inline-block shadow-sm">
              <p className="text-gray-600 text-sm font-semibold mb-4">Metode 1: Scan QR Code</p>
              <div className="bg-white p-3 rounded-xl ring-1 ring-gray-100">
                <QRCodeSVG value={status.qrCode} size={220} level="M" includeMargin={false} />
              </div>
            </div>
          )}

          {/* Pairing Code Option */}
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 max-w-sm mx-auto">
            <p className="text-gray-900 text-sm font-bold mb-4">Metode 2: Menggunakan Pairing Code</p>
            {pairingCode ? (
              <div className="space-y-4">
                <div className="text-3xl font-mono font-black tracking-[0.4em] text-gray-900 bg-white py-4 rounded-xl border border-gray-300 shadow-inner">
                  {pairingCode}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed px-4">
                  Buka WhatsApp di HP Anda:<br/>
                  <span className="font-semibold text-gray-700">Setelan → Perangkat Tertaut → Tautkan Perangkat → Tautkan dengan nomor telepon</span>
                </p>
                <button onClick={() => setPairingCode('')} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                  Batalkan dan gunakan nomor lain
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-sm font-medium tracking-widest focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:tracking-normal placeholder:font-normal" 
                  placeholder="Contoh: 62812345678" 
                  value={pairingPhone} 
                  onChange={e => setPairingPhone(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <button 
                  onClick={() => pairingMut.mutate(pairingPhone)} 
                  disabled={pairingMut.isPending || !pairingPhone || pairingPhone.length < 10}
                  className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {pairingMut.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  {pairingMut.isPending ? 'Meminta Kode...' : 'Dapatkan Kode Pairing'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 border-t border-gray-100 pt-8 mt-4">
        {!status?.isConnected && !status?.hasQR && !pairingCode && (
          <button onClick={() => connectMut.mutate()} disabled={connectMut.isPending}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 text-sm">
            {connectMut.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Mulai Koneksi Bot
          </button>
        )}
        <button onClick={() => refetch()} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-sm">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {status?.isConnected && (
        <div className="mt-8 text-left bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-700" />
            <p className="text-sm font-bold text-gray-900">Perintah Bot Aktif:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['MENU', 'DAFTAR TOKO | nama | kab', 'JUAL [produk] [harga]', 'STOK', 'PESANAN', 'ONGKIR [asal] [tujuan]', 'Tanya AI (Bebas)'].map(cmd => (
              <span key={cmd} className="text-xs font-mono bg-white border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5 text-gray-600">
                {cmd}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Users ─────────────────────────────────────────────────────────────────

function UsersTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { showConfirm } = useModalStore();
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
    <Card className="p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Manajemen User</h3>
            <p className="text-xs text-gray-500 font-medium">{data?.length || 0} pengguna ditemukan</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all" 
            placeholder="Cari nama atau no HP..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Pengguna</th>
              <th className="px-6 py-4 font-semibold">Kontak</th>
              <th className="px-6 py-4 font-semibold">Role Sistem</th>
              <th className="px-6 py-4 font-semibold">Tgl Daftar</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(data || []).map((u: User) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{u.name}</span>
                    {u.is_verified ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : null}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{u.phone}</span>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role} 
                    onChange={e => roleMut.mutate({ id: u.id, role: e.target.value })}
                    className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { showConfirm(`Hapus permanen user ${u.name}?`, () => { deleteMut.mutate(u.id); }); }}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors inline-flex"
                    title="Hapus User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Tidak ada data pengguna ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── RAG Docs ─────────────────────────────────────────────────────────────

function RagTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { showConfirm } = useModalStore();
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
    <Card>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Dokumen Knowledge Base AI</h3>
          <p className="text-sm text-gray-500 mt-0.5">Total {data?.length || 0} dokumen terindeks dalam sistem</p>
        </div>
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-6 flex gap-3 text-sm text-blue-800">
        <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p>Dokumen berstatus <b>Global</b> akan dipelajari AI dan informasinya dapat diakses oleh semua pengguna. Dokumen <b>Private</b> hanya spesifik untuk pengguna pengunggah.</p>
      </div>

      <div className="space-y-3">
        {(data || []).map((d: RagDoc) => (
          <div key={d.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all bg-white group">
            <div className="flex-1 min-w-0 pr-4">
              <div className="font-semibold text-gray-900 text-sm truncate mb-1">{d.title}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded uppercase font-medium tracking-wide">{d.source_type}</span>
                <span>•</span>
                <span>{d.chunk_count} vektor chunks</span>
                <span>•</span>
                <span>{new Date(d.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => toggleMut.mutate({ id: d.id, is_global: !d.is_global })}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border ${
                  d.is_global 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {d.is_global ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {d.is_global ? 'Global' : 'Private'}
              </button>
              <button 
                onClick={() => { showConfirm('Hapus permanen dokumen ini beserta vektor datanya?', () => { deleteMut.mutate(d.id); }); }}
                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Hapus Dokumen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Belum ada dokumen AI yang diupload.</p>
            <p className="text-gray-400 text-xs mt-1">Gunakan halaman AI Chat untuk menambah knowledge base.</p>
          </div>
        )}
      </div>
    </Card>
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-2 h-fit">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Plus className="w-5 h-5" /></div>
          <h3 className="font-bold text-gray-900 text-lg">Tambah Komoditas</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nama Komoditas</label>
            <input 
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" 
              placeholder="Contoh: Bawang Merah Super" 
              value={form.nama} onChange={set('nama')} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Kategori</label>
            <input 
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" 
              placeholder="Contoh: Sayuran" 
              value={form.kategori} onChange={set('kategori')} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Satuan Dasar</label>
            <select 
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white" 
              value={form.satuan} onChange={set('satuan')}
            >
              {['kg', 'gram', 'ikat', 'buah', 'liter', 'ton', 'karung'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Deskripsi <span className="text-gray-400 font-normal">(Opsional)</span></label>
            <input 
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" 
              placeholder="Keterangan tambahan" 
              value={form.deskripsi} onChange={set('deskripsi')} 
            />
          </div>
          
          <button 
            onClick={() => addMut.mutate(form)} 
            disabled={addMut.isPending || !form.nama || !form.kategori}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMut.isPending ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Simpan Komoditas
          </button>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Sprout className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Master Data Komoditas</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{(data as unknown[])?.length || 0} item terdaftar di database</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nama Item</th>
                  <th className="px-5 py-3 font-semibold">Kategori</th>
                  <th className="px-5 py-3 font-semibold">Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(data as Record<string, unknown>[] || []).map((k: Record<string, unknown>) => (
                  <tr key={String(k.id)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{String(k.nama)}</td>
                    <td className="px-5 py-3 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{String(k.kategori)}</span></td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{String(k.satuan)}</td>
                  </tr>
                ))}
                {(!data || (data as unknown[]).length === 0) && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">Belum ada data komoditas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
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
      setResult({ message: (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Terjadi kesalahan sistem', migrations: [] });
    } finally { setLoading(false); }
  };

  return (
    <Card className="max-w-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-xl">Database Migration</h3>
          <p className="text-sm text-gray-500">Sinkronisasi struktur skema database ke versi terbaru</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        Modul ini akan mengeksekusi script migration yang <b>belum</b> dijalankan. 
        Aman untuk dijalankan berulang kali, sistem secara otomatis akan melewati tabel yang sudah ada.
      </p>

      <button 
        onClick={runMigration} 
        disabled={loading} 
        className="bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        Jalankan Migration Sekarang
      </button>

      {result && (
        <div className={`rounded-xl p-5 text-sm border ${
          result.migrations?.length === 0 && result.message?.toLowerCase().includes('up to date') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : result.message?.toLowerCase().includes('error') || result.message?.toLowerCase().includes('kesalahan')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="font-bold mb-3 flex items-center gap-2">
            {result.migrations?.length === 0 ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            {result.message}
          </div>
          {result.migrations?.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-current/20">
              <div className="text-xs font-semibold mb-2 uppercase opacity-80">Executed Files:</div>
              {result.migrations.map((m: string) => (
                <div key={m} className="font-mono text-xs flex items-center gap-2">
                  <span className="opacity-50">↳</span> {m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Settings Panel ──────────────────────────────────────────────────────────
function SettingsPanel() {
  const qc = useQueryClient();
  const { showAlert, showConfirm } = useModalStore();
  const [testEmail, setTestEmail] = useState('');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  type SettingRow = { key: string; value: string; description: string; group: string; is_secret: boolean };
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: (): Promise<SettingRow[]> => api.get('/admin/settings').then(r => r.data.data),
  });

  // Sync settings ke local state setelah data berhasil di-fetch
  useEffect(() => {
    if (data && Object.keys(localSettings).length === 0) {
      const map: Record<string, string> = {};
      data.forEach((s: SettingRow) => { map[s.key] = s.value || ''; });
      setLocalSettings(map);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (updates: Record<string, string>) => api.patch('/admin/settings', updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); showAlert('✅ Pengaturan berhasil disimpan!'); setDirty(false); },
    onError: () => showAlert('❌ Gagal menyimpan pengaturan'),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/admin/settings/test-smtp', { email: testEmail }),
    onSuccess: (r) => showAlert(`✅ ${r.data.message}`),
    onError: (e: any) => showAlert(`❌ ${e.response?.data?.error || 'Gagal kirim test email. Pastikan SMTP sudah dikonfigurasi.'}`),
  });

  const setSetting = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const groups = data ? [...new Set(data.map((s) => s.group))] : [];
  const groupLabels: Record<string, string> = { smtp: '📧 Konfigurasi SMTP Email', general: '⚙️ Pengaturan Umum' };

  if (isLoading) return <div className="text-center py-12"><RefreshCw className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <Card key={group} title={groupLabels[group] || group}>
          <div className="space-y-4">
            {data?.filter((s: any) => s.group === group).map((s: any) => (
              <div key={s.key}>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  {s.description}
                  {s.is_secret && <span className="ml-2 text-amber-500 text-[10px]">🔒 Secret</span>}
                </label>
                <div className="relative">
                  <input
                    type={s.is_secret ? 'password' : 'text'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none text-sm font-mono transition-all"
                    value={localSettings[s.key] ?? ''}
                    placeholder={s.is_secret ? '(tetap kosong jika tidak diubah)' : ''}
                    onChange={e => setSetting(s.key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* SMTP Test */}
      <Card title="🧪 Test Pengiriman Email">
        <div className="flex gap-3">
          <input
            type="email"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 outline-none text-sm"
            placeholder="email@contoh.com"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
          />
          <button onClick={() => testMutation.mutate()} disabled={!testEmail || testMutation.isPending}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
            {testMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : null}
            Kirim Test
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Pastikan SMTP sudah dikonfigurasi dan disimpan sebelum test.</p>
      </Card>

      {/* Save button */}
      {dirty && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex justify-end">
          <button onClick={() => saveMutation.mutate(localSettings)}
            disabled={saveMutation.isPending}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-xl hover:bg-green-700 transition flex items-center gap-2">
            {saveMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : null}
            💾 Simpan Pengaturan
          </button>
        </motion.div>
      )}
    </div>
  );
}