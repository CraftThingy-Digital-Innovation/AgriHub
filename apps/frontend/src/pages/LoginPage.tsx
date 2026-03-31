import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/agrihub-logo.png'; // Menggunakan logo agrihub
import api from '../lib/api';
import { Phone, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react'; // Tambahkan lucide-react untuk ikon

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
    <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-300 rounded-full blur-[120px] opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md p-2"
            >
              <img src={logo} alt="AgriHub Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black text-green-950 tracking-tight">AgriHub</h1>
            <p className="text-green-700 font-medium text-sm">Ketahanan Pangan Digital</p>
          </div>

          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-green-600">
                        <Phone size={18} />
                      </div>
                      <input
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-300 font-bold text-green-900"
                        placeholder="08xxxxxxxxxx"
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex items-start gap-2 px-1">
                       <span className="text-[11px] leading-relaxed text-green-600 italic">
                         *Gunakan nomor WhatsApp aktif untuk menerima notifikasi otomatis.
                       </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(22,163,74,0.3)] hover:bg-green-700 hover:shadow-none active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    {loading ? '⏳ Mengecek...' : (
                      <>
                        Lanjutkan 
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Akun Status Card */}
                  <div className="bg-green-50/80 border border-green-100 p-4 rounded-2xl flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Status Akun</p>
                      <p className="text-sm font-bold text-green-900 truncate max-w-[150px]">
                        {exists?.exists ? exists.name : 'Anggota Baru'}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-[10px] bg-white border border-green-200 text-green-700 font-bold px-3 py-1.5 rounded-xl hover:bg-green-50 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={12} /> Ubah Nomor
                    </button>
                  </div>

                  {!exists?.exists && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><User size={18} /></div>
                        <input
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                          placeholder="Nama lengkap Anda"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Lock size={18} /></div>
                      <input
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                        placeholder="Min. 8 karakter"
                        type="password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        required
                        minLength={8}
                        autoFocus
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Lock size={18} /></div>
                        <input
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                          placeholder="Ulangi password"
                          type="password"
                          value={form.retypePassword}
                          onChange={e => setForm(f => ({ ...f, retypePassword: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 text-[11px] font-bold text-center py-3 rounded-xl border border-red-100 animate-pulse">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? '⏳ Memproses...' : (
                      <>
                        <img src={logo} className="w-5 h-5 brightness-0 invert" alt="" />
                        {exists?.exists ? 'Masuk Sekarang' : 'Daftar Sekarang'}
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-green-700 font-bold transition-colors">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}