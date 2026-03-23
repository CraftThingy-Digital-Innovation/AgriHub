import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ phone: '', name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      if (data.success) {
        setAuth(data.data.user, data.data.token);
        navigate('/app');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Terjadi kesalahan, coba lagi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-green-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-3xl mx-auto mb-3">🌾</div>
            <h1 className="text-2xl font-bold text-green-900">AgriHub Indonesia</h1>
            <p className="text-sm text-green-700 mt-1">Platform Digitalisasi Ketahanan Pangan</p>
          </div>

          {/* Toggle */}
          <div className="flex bg-green-50 rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-white text-green-800 shadow-sm' : 'text-green-600'}`}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Nama Lengkap</label>
                <input
                  className="input-field"
                  placeholder="Nama lengkap Anda"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">Nomor WhatsApp</label>
              <input
                className="input-field"
                placeholder="08xxxxxxxxxx"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">Password</label>
              <input
                className="input-field"
                placeholder="Minimal 8 karakter"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="badge badge-red w-full text-center py-2 rounded-lg text-xs">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
            >
              {loading ? '⏳ Memproses...' : mode === 'login' ? '🌾 Masuk' : '🚀 Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/" className="text-xs text-green-600 hover:text-green-800">← Kembali ke Beranda</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
