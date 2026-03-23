import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ phone: '', name: '', password: '', retypePassword: '' });
  const [exists, setExists] = useState<{ exists: boolean; name?: string } | null>(null);

  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) setForm(f => ({ ...f, phone }));
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/auth/check-phone/${form.phone}`);
      if (data.success) {
        setExists({ exists: data.exists, name: data.name });
        setMode(data.exists ? 'login' : 'register');
        setStep(2);
      }
    } catch (err) {
      setError('Gagal mengecek nomor. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.retypePassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      if (data.success) {
        setAuth(data.data.user, data.data.token);
        
        const lid = searchParams.get('lid');
        const action = searchParams.get('action');
        let redirectUrl = '/app';
        if (lid || action) {
          const params = new URLSearchParams();
          if (lid) params.set('lid', lid);
          if (action) params.set('action', action);
          redirectUrl += `?${params.toString()}`;
        }
        navigate(redirectUrl);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Terjadi kesalahan, coba lagi';
      setError(msg);
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
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg">🌾</div>
            <h1 className="text-2xl font-bold text-green-900">AgriHub Indonesia</h1>
            <p className="text-sm text-green-700 mt-1">Platform Digitalisasi Ketahanan Pangan</p>
          </div>

          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-4">
            {step === 1 ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-1">Nomor WhatsApp</label>
                  <input
                    className="input-field"
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-green-600 mt-1 italic">*Masukkan nomor HP Anda yang terdaftar.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading ? '⏳ Mengecek...' : 'Lanjutkan →'}
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Status Akun</p>
                      <p className="text-sm font-semibold text-green-900">
                        {exists?.exists ? `Selamat Datang Kembali, ${exists.name}!` : 'Anggota Baru'}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-[10px] bg-green-200/50 hover:bg-green-200 text-green-700 px-2 py-1 rounded-md transition-colors"
                    >
                      Ubah Nomor
                    </button>
                  </div>
                </div>

                {!exists?.exists && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-medium text-green-800 mb-1">Nama Lengkap</label>
                    <input
                      className="input-field"
                      placeholder="Nama lengkap Anda"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </motion.div>
                )}

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
                    autoFocus
                  />
                </div>

                {!exists?.exists && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-medium text-green-800 mb-1">Ulangi Password</label>
                    <input
                      className="input-field"
                      placeholder="Ketik ulang password"
                      type="password"
                      value={form.retypePassword}
                      onChange={e => setForm(f => ({ ...f, retypePassword: e.target.value }))}
                      required
                    />
                  </motion.div>
                )}

                {error && (
                  <div className="badge badge-red w-full text-center py-2 rounded-lg text-xs">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base shadow-md"
                >
                  {loading ? '⏳ Memproses...' : exists?.exists ? '🌾 Masuk & Tautkan' : '🚀 Daftar Sekarang'}
                </button>
              </motion.div>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-green-600 hover:text-green-800 font-medium">← Kembali ke Beranda</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
