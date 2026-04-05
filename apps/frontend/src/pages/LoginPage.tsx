import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/agrihub-logo.png';
import api from '../lib/api';
import {
  Phone, Lock, User, AtSign, Mail, ArrowRight, ChevronLeft,
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertCircle, Shield
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type FlowStep =
  | 'identifier'    // Step 1: Masuk identifier
  | 'password'      // Step 2: Login — isi password
  | 'register'      // Step 2: Register — isi semua data
  | 'otp'           // Step 3: Verifikasi OTP WA
  | 'email_otp'     // Step 4: Verifikasi OTP Email
  | 'puter_profile' // Step setelah Puter: isi phone + password
  | 'forgot_password' // Lupa password: kirim OTP
  | 'reset_otp'      // Verifikasi OTP reset
  | 'reset_password' // Set password baru
  | 'success';

interface FormState {
  identifier: string;
  name: string; username: string; email: string;
  password: string; retypePassword: string;
  otp: string; phone: string;
  resetMethod: 'wa' | 'email';
}

// ─── Password strength utils ──────────────────────────────────────────────────
const rules = [
  { label: 'Minimal 8 karakter', test: (p: string) => p.length >= 8 },
  { label: 'Huruf kapital (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Huruf kecil (a-z)',   test: (p: string) => /[a-z]/.test(p) },
  { label: 'Angka (0-9)',         test: (p: string) => /\d/.test(p) },
  { label: 'Karakter spesial (!@#$…)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = rules.filter(r => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {rules.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? colors[Math.min(passed - 1, 4)] : '#e5e7eb' }} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-0.5">
        {rules.map((r, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${r.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
            {r.test(password) ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Password Input ───────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id, label }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; id: string; label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Lock size={18} /></div>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-semibold text-green-900"
          placeholder={placeholder || 'Min. 8 karakter, huruf besar, angka, spesial'}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-4 flex items-center text-green-400 hover:text-green-700 transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<FlowStep>('identifier');
  const [form, setForm] = useState<FormState>({
    identifier: '', name: '', username: '', email: '',
    password: '', retypePassword: '', otp: '', phone: '',
    resetMethod: 'wa',
  });
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resetMethods, setResetMethods] = useState<string[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [isPuterFlow, setIsPuterFlow] = useState(false);
  const { setAuth, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) setForm(f => ({ ...f, identifier: phone }));
    const mode = searchParams.get('mode');
    if (mode === 'register') setStep('register');
  }, []);

  // Redirect jika sudah login & verifikasi lengkap (Nomor HP & Email)
  useEffect(() => {
    const { token, user } = useAuthStore.getState();
    if (token && user) {
      const needsPhone = !user.phone_verified;
      const needsEmail = user.email && !user.email_verified;

      if (!needsPhone && !needsEmail) {
        navigate('/app', { replace: true });
      } else {
        if (needsPhone) setStep('otp');
        else if (needsEmail) {
          api.post('/auth/send-email-otp').catch(() => {});
          setStep('email_otp');
        }
      }
    }
  }, []);

  // Username realtime check
  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-username/${form.username}`);
        setUsernameStatus(data.available ? 'ok' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 500);
  }, [form.username]);

  // ── Step 1: Cek identifier ────────────────────────────────────────────────
  async function handleCheckIdentifier(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const id = form.identifier.trim();
    if (!id) return;
    setLoading(true);
    try {
      let exists = false;
      // Cek apakah identifier adalah nomor HP
      const isPhone = /^\+?[0-9]{8,15}$/.test(id.replace(/[\s-]/g, ''));
      if (isPhone) {
        const { data } = await api.get(`/auth/check-phone/${id}`);
        exists = data.exists;
        if (data.exists) { setForm(f => ({ ...f, name: data.name || '' })); }
      } else {
        // Username atau email — anggap sudah terdaftar, langsung ke login
        exists = true;
      }
      setAccountExists(exists);
      setStep(exists ? 'password' : 'register');
    } catch {
      setError('Gagal memeriksa akun. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Login ─────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        identifier: form.identifier,
        password: form.password,
      });
      if (data.success) {
        setAuth(data.data.user, data.data.token);
        navigate(getRedirectUrl());
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal');
    } finally { setLoading(false); }
  }

  // ── Step 2: Register ──────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.retypePassword) { setError('Password tidak cocok'); return; }
    if (usernameStatus === 'taken') { setError('Username sudah digunakan'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        phone: form.identifier.replace(/[\s-]/g, ''),
        name: form.name,
        username: form.username || undefined,
        email: form.email || undefined,
        password: form.password,
      });
      if (data.success) {
        setAuth(data.data.user, data.data.token);
        // Kirim OTP untuk verifikasi nomor HP
        await api.post('/auth/send-phone-otp');
        setStep('otp');
        setSuccess('OTP dikirim ke WhatsApp Anda!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mendaftar');
    } finally { setLoading(false); }
  }

  // ── Step 3: Verifikasi OTP ────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-phone-otp', { otp: form.otp });
      if (data.success) {
        updateUser(data.data.user);
        setStep('success');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP salah atau kadaluarsa');
    } finally { setLoading(false); }
  }

  async function handleResendOtp() {
    setError(''); setSuccess('');
    try {
      if (step === 'email_otp') {
        await api.post('/auth/send-email-otp');
        setSuccess('Kode OTP Email dikirim ulang!');
      } else {
        await api.post('/auth/send-phone-otp');
        setSuccess('OTP WhatsApp dikirim ulang!');
      }
    } catch { setError('Gagal kirim ulang OTP'); }
  }

  async function handleVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email-otp', { otp: form.otp });
      if (data.success) {
        updateUser(data.data.user);
        setStep('success');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kode OTP Email salah');
    } finally { setLoading(false); }
  }

  // ── Puter OAuth ───────────────────────────────────────────────────────────
  async function handlePuterLogin() {
    setError('');
    setLoading(true);
    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error('Puter SDK tidak tersedia');
      const puterUser = await puter.auth.signIn();
      if (!puterUser) throw new Error('Login Puter dibatalkan');

      const puter_token = puterUser.token || puterUser.auth_token;
      const puter_user_id = puterUser.username || puterUser.uuid;
      const puter_name = puterUser.username || puterUser.email;
      const puter_email = puterUser.email;
      const puter_username = puterUser.username;

      const { data } = await api.post('/auth/login-puter', {
        puter_token, puter_user_id, puter_name, puter_email, puter_username,
      });

      if (data.success) {
        setAuth(data.data.user, data.data.token);
        if (data.data.needs_phone) {
          setIsPuterFlow(true);
          setForm(f => ({ ...f, name: data.data.user.name || '' }));
          setStep('puter_profile');
        } else if (data.data.needs_email_verify) {
          await api.post('/auth/send-email-otp');
          setStep('email_otp');
        } else {
          navigate(getRedirectUrl());
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login Puter gagal');
    } finally { setLoading(false); }
  }

  // ── Puter Profile Completion (phone + password) ───────────────────────────
  async function handleCompletePuterProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password && form.password !== form.retypePassword) { setError('Password tidak cocok'); return; }
    setLoading(true);
    try {
      await api.post('/auth/complete-puter-profile', {
        phone: form.phone.replace(/[\s-]/g, ''),
        password: form.password || undefined,
        retype_password: form.retypePassword || undefined,
      });
      // OTP sudah dikirim oleh backend
      setStep('otp');
      setSuccess('OTP dikirim ke WhatsApp Anda!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan profil');
    } finally { setLoading(false); }
  }

  // ── Forgot Password Handlers ─────────────────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.identifier) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { identifier: form.identifier });
      setResetMethods(data.methods);
      if (data.methods.length === 1) {
        const method = data.methods[0];
        setForm(f => ({ ...f, resetMethod: method }));
        await api.post('/auth/request-reset-otp', { identifier: form.identifier, method });
        setStep('reset_otp');
        setSuccess(`OTP terkirim ke ${method === 'wa' ? 'WhatsApp' : 'Email'} Anda.`);
      } else {
        // Biarkan di step ini tapi render pilihan
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Identitas tidak ditemukan');
    } finally { setLoading(true); setLoading(false); }
  }

  async function handleSelectResetMethod(method: 'wa' | 'email') {
    setError(''); setLoading(true);
    try {
      setForm(f => ({ ...f, resetMethod: method }));
      await api.post('/auth/request-reset-otp', { identifier: form.identifier, method });
      setStep('reset_otp');
      setSuccess(`OTP terkirim ke ${method === 'wa' ? 'WhatsApp' : 'Email'} Anda.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim OTP');
    } finally { setLoading(false); }
  }

  async function handleVerifyResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp', { identifier: form.identifier, otp: form.otp });
      setStep('reset_password');
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP salah atau kadaluarsa');
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.retypePassword) { setError('Password tidak cocok'); return; }
    
    const passed = rules.filter(r => r.test(form.password)).length;
    if (passed < 5) { setError('Password belum memenuhi standar keamanan.'); return; }
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: form.otp, // In reset flow, otp field holds the reset token
        password: form.password
      });
      setSuccess('Password berhasil diubah. Silakan login kembali.');
      setStep('identifier');
      setForm(f => ({ ...f, password: '', retypePassword: '', otp: '' }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mereset password');
    } finally { setLoading(false); }
  }

  async function handleRequestWALink() {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/request-whatsapp-link');
      const waUrl = `https://wa.me/6285788061314?text=VERIFIKASI%20${data.token}`;
      window.open(waUrl, '_blank');
    } catch { setError('Gagal generate token WhatsApp'); }
    finally { setLoading(false); }
  }

  function getRedirectUrl() {
    const lid = searchParams.get('lid');
    const action = searchParams.get('action');
    if (lid || action) {
      const p = new URLSearchParams();
      if (lid) p.set('lid', lid);
      if (action) p.set('action', action);
      return `/app?${p.toString()}`;
    }
    return '/app';
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-300 rounded-full blur-[120px] opacity-50" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10">

          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div whileHover={{ scale: 1.05 }}
              className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md p-2">
              <img src={logo} alt="AgriHub Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black text-green-950 tracking-tight">AgriHub</h1>
            <p className="text-green-700 font-medium text-sm">Ketahanan Pangan Digital</p>
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP: identifier ──────────────────────────────────────── */}
            {step === 'identifier' && (
              <motion.div key="identifier" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleCheckIdentifier} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">
                      Nomor HP, Username, atau Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Phone size={18} /></div>
                      <input id="login-identifier"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-green-900"
                        placeholder="08xxxxxxxx / @username / email"
                        value={form.identifier}
                        onChange={set('identifier')}
                        required autoFocus />
                    </div>
                    <div className="flex justify-end mt-1">
                      <button type="button" onClick={() => setStep('forgot_password')}
                        className="text-xs font-bold text-green-700 hover:text-green-900 transition-colors mr-1">
                        Lupa password?
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}

                  <button type="submit" id="btn-check-identifier" disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(22,163,74,0.3)] hover:bg-green-700 transition-all flex items-center justify-center gap-2 group">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                      <>Lanjutkan <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <hr className="flex-1 border-green-100" />
                    <span className="text-xs text-green-400 font-bold">atau</span>
                    <hr className="flex-1 border-green-100" />
                  </div>

                  {/* Puter Login */}
                  <button type="button" id="btn-puter-login" onClick={handlePuterLogin} disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                    <Shield size={18} />
                    Masuk / Daftar dengan Puter.com
                  </button>
                  <p className="text-[10px] text-center text-gray-400">
                    Login Puter otomatis membuat akun AgriHub Anda jika belum ada.
                  </p>
                </form>
              </motion.div>
            )}

            {/* ── STEP: password (login) ────────────────────────────────── */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Status card */}
                  <div className="bg-green-50 border border-green-100 p-3 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-green-600 uppercase">Masuk sebagai</p>
                      <p className="text-sm font-bold text-green-900 truncate max-w-[160px]">{form.name || form.identifier}</p>
                    </div>
                    <button type="button" onClick={() => { setStep('identifier'); setError(''); }}
                      className="text-[10px] bg-white border border-green-200 text-green-700 font-bold px-3 py-1.5 rounded-xl hover:bg-green-50 flex items-center gap-1">
                      <ChevronLeft size={12} /> Ubah
                    </button>
                  </div>

                  <PasswordInput id="login-password" label="Password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />

                  <div className="flex justify-end -mt-2">
                    <button type="button" onClick={() => setStep('forgot_password')}
                      className="text-xs font-bold text-green-700 hover:text-green-900 transition-colors">
                      Lupa password?
                    </button>
                  </div>

                  {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

                  <button type="submit" id="btn-login" disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : '🔑 Masuk Sekarang'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: register ────────────────────────────────────────── */}
            {(step === 'register' || step === 'puter_profile') && (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={step === 'register' ? handleRegister : handleCompletePuterProfile} className="space-y-4">

                  {/* Header */}
                  <div className="flex items-center gap-3 pb-1">
                    {!isPuterFlow && (
                      <button type="button" onClick={() => { setStep('identifier'); setError(''); }}
                        className="text-green-600 hover:text-green-800 transition-colors"><ChevronLeft size={20} /></button>
                    )}
                    <div>
                      <p className="font-black text-green-900 text-base">
                        {isPuterFlow ? '📱 Lengkapi Profil Anda' : '🌾 Daftar Akun Baru'}
                      </p>
                      <p className="text-[11px] text-green-600">
                        {isPuterFlow ? 'Tambahkan nomor WA & password' : `Nomor: ${form.identifier}`}
                      </p>
                    </div>
                  </div>

                  {/* Phone (untuk puter flow) */}
                  {isPuterFlow && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Nomor WhatsApp *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Phone size={18} /></div>
                        <input id="puter-phone"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                          placeholder="08xxxxxxxxxx"
                          type="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          required />
                      </div>
                    </div>
                  )}

                  {/* Nama */}
                  {!isPuterFlow && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><User size={18} /></div>
                        <input id="reg-name"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                          placeholder="Nama lengkap Anda"
                          value={form.name}
                          onChange={set('name')}
                          required />
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">
                      Username <span className="text-gray-400">(opsional, unik)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><AtSign size={18} /></div>
                      <input id="reg-username"
                        className={`w-full pl-12 pr-10 py-4 rounded-2xl bg-green-50/50 border outline-none transition-all font-bold text-green-900
                          ${usernameStatus === 'ok' ? 'border-green-500 focus:ring-4 focus:ring-green-500/10' :
                            usernameStatus === 'taken' ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-green-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'}`}
                        placeholder="contoh: petani_andi (3-30 karakter)"
                        value={form.username}
                        onChange={set('username')} />
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        {usernameStatus === 'checking' && <Loader2 size={16} className="text-gray-400 animate-spin" />}
                        {usernameStatus === 'ok' && <CheckCircle2 size={16} className="text-green-500" />}
                        {usernameStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
                      </div>
                    </div>
                    {usernameStatus === 'taken' && <p className="text-[11px] text-red-500 ml-1">Username sudah digunakan</p>}
                    {usernameStatus === 'ok' && <p className="text-[11px] text-green-600 ml-1">Username tersedia ✓</p>}
                  </div>

                  {/* Email */}
                  {!isPuterFlow && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">
                        Email <span className="text-gray-400">(opsional, untuk verifikasi)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Mail size={18} /></div>
                        <input id="reg-email" type="email"
                          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-green-900"
                          placeholder="email@contoh.com"
                          value={form.email}
                          onChange={set('email')} />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <PasswordInput id="reg-password" label="Password *" value={form.password}
                    onChange={v => setForm(f => ({ ...f, password: v }))} />
                  <PasswordStrength password={form.password} />

                  <PasswordInput id="reg-retype-password" label="Konfirmasi Password *"
                    placeholder="Ulangi password yang sama"
                    value={form.retypePassword}
                    onChange={v => setForm(f => ({ ...f, retypePassword: v }))} />
                  {form.retypePassword && form.password !== form.retypePassword && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 ml-1">
                      <AlertCircle size={12} /> Password tidak cocok
                    </p>
                  )}
                  {form.retypePassword && form.password === form.retypePassword && form.retypePassword.length > 0 && (
                    <p className="text-[11px] text-green-600 flex items-center gap-1 ml-1">
                      <CheckCircle2 size={12} /> Password cocok ✓
                    </p>
                  )}

                  {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl flex gap-2"><AlertCircle size={14} />{error}</p>}

                  <button type="submit" id="btn-register" disabled={loading || usernameStatus === 'taken'}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                      isPuterFlow ? '📱 Simpan & Verifikasi WA' : '🌾 Daftar & Verifikasi WA'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: OTP verification ────────────────────────────────── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="text-5xl">💬</div>
                    <h2 className="font-black text-green-900 text-lg">Verifikasi WhatsApp</h2>
                    <p className="text-sm text-green-600">
                      Kode OTP 6-digit dikirim ke WhatsApp Anda. Masukkan kode di bawah ini.
                    </p>
                  </div>

                  {success && <div className="bg-green-50 text-green-700 text-[11px] font-bold p-3 rounded-xl text-center border border-green-100">{success}</div>}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Kode OTP (6 Digit)</label>
                    <input id="otp-input"
                      className="w-full px-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-black text-green-900 text-center text-2xl tracking-[0.5em]"
                      placeholder="• • • • • •"
                      value={form.otp}
                      onChange={set('otp')}
                      maxLength={6}
                      inputMode="numeric"
                      required autoFocus />
                  </div>

                  {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

                  <button type="submit" id="btn-verify-otp" disabled={loading || form.otp.length !== 6}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : '✅ Verifikasi Sekarang'}
                  </button>

                  <button type="button" onClick={handleResendOtp}
                    className="w-full text-green-600 font-bold text-sm hover:underline">
                    Kirim Ulang OTP
                  </button>
                </form>
              </motion.div>
            )}
            {/* ── STEP: email_otp verification ─────────────────────────────── */}
            {step === 'email_otp' && (
              <motion.div key="email_otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="text-5xl">📧</div>
                    <h2 className="font-black text-green-900 text-lg">Verifikasi Email</h2>
                    <p className="text-sm text-green-600">
                      Kode verifikasi 6-digit telah dikirim ke email Anda. Periksa folder Inbox atau Spam.
                    </p>
                  </div>

                  {success && <div className="bg-green-50 text-green-700 text-[11px] font-bold p-3 rounded-xl text-center border border-green-100">{success}</div>}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Kode Verifikasi (6 Digit)</label>
                    <input id="email-otp-input"
                      className="w-full px-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-black text-green-900 text-center text-2xl tracking-[0.5em]"
                      placeholder="• • • • • •"
                      value={form.otp}
                      onChange={set('otp')}
                      maxLength={6}
                      inputMode="numeric"
                      required autoFocus />
                  </div>

                  {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

                  <button type="submit" id="btn-verify-email-otp" disabled={loading || form.otp.length !== 6}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : '📧 Verifikasi Email'}
                  </button>

                  <button type="button" onClick={handleResendOtp}
                    className="w-full text-green-600 font-bold text-sm hover:underline">
                    Kirim Ulang Kode Email
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: forgot_password ────────────────────────────────── */}
            {step === 'forgot_password' && (
              <motion.div key="forgot_password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="flex items-center gap-3 pb-1">
                    <button type="button" onClick={() => setStep('password')} className="text-green-600"><ChevronLeft size={20} /></button>
                    <h2 className="font-black text-green-900 text-lg">Lupa Password?</h2>
                  </div>
                  <p className="text-xs text-green-700">Masukkan identitas Anda (Phone/Username/Email) untuk mendapatkan kode reset.</p>
                  
                  <div className="space-y-1">
                    <input className="w-full px-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-bold text-green-900"
                      placeholder="Identitas Anda" value={form.identifier} onChange={set('identifier')} required disabled={resetMethods.length > 0} />
                  </div>

                  {resetMethods.length > 1 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-bold text-green-800 text-center uppercase tracking-wider">Pilih Metode Pengiriman OTP</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => handleSelectResetMethod('wa')}
                          className="p-4 rounded-2xl border-2 border-green-100 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                          <Phone className="text-green-600" size={24} />
                          <span className="text-xs font-black text-green-900">WhatsApp</span>
                        </button>
                        <button type="button" onClick={() => handleSelectResetMethod('email')}
                          className="p-4 rounded-2xl border-2 border-green-100 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                          <Mail className="text-green-600" size={24} />
                          <span className="text-xs font-black text-green-900">Email</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}

                  {resetMethods.length <= 1 && (
                    <button type="submit" disabled={loading}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={20} className="animate-spin" /> : 'Kirim Kode Verifikasi'}
                    </button>
                  )}

                  {resetMethods.length > 0 && (
                    <button type="button" onClick={() => { setResetMethods([]); setError(''); }}
                      className="w-full text-xs font-bold text-green-600 hover:text-green-800">
                      Ganti Identitas
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {/* ── STEP: reset_otp ───────────────────────────────────────── */}
            {step === 'reset_otp' && (
              <motion.div key="reset_otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleVerifyResetOtp} className="space-y-5 text-center">
                  <h2 className="font-black text-green-900 text-lg">Verifikasi Reset</h2>
                  <p className="text-xs text-green-700">Masukkan 6 digit kode yang dikirim ke {form.resetMethod === 'wa' ? 'WhatsApp' : 'Email'}.</p>
                  {success && <p className="text-[11px] text-green-600 font-bold">{success}</p>}
                  
                  <input className="w-full px-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 outline-none transition-all font-black text-green-900 text-center text-2xl tracking-[0.5em]"
                    placeholder="• • • • • •" value={form.otp} onChange={set('otp')} maxLength={6} required autoFocus />

                  {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}

                  <button type="submit" disabled={loading || form.otp.length !== 6}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verifikasi Kode'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: reset_password ──────────────────────────────────── */}
            {step === 'reset_password' && (
              <motion.div key="reset_password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <h2 className="font-black text-green-900 text-lg">Atur Password Baru</h2>
                  
                  <PasswordInput id="new-password" label="Password Baru" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />
                  <PasswordInput id="re-new-password" label="Konfirmasi Password Baru" value={form.retypePassword} onChange={v => setForm(f => ({ ...f, retypePassword: v }))} />

                  {error && <p className="text-red-500 text-[11px] font-bold">{error}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Simpan Password Baru'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP: success ─────────────────────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl">🎉</motion.div>
                <div>
                  <h2 className="font-black text-green-900 text-xl">Selamat Datang!</h2>
                  <p className="text-green-600 text-sm mt-1">Akun Anda berhasil diverifikasi. Selamat bergabung!</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-[2rem] border border-blue-100 text-left space-y-3">
                   <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                     <Shield size={14} /> Keamanan Bot
                   </p>
                   <p className="text-xs text-blue-700 leading-relaxed">
                     Agar robot Asisten AI dapat mengenali Anda di WhatsApp secara personal, pastikan akun WhatsApp Anda sudah tertaut.
                   </p>
                   <button onClick={handleRequestWALink} disabled={loading}
                     className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                     {loading ? <Loader2 size={12} className="animate-spin" /> : '🔗 Tautkan WhatsApp Sekarang'}
                   </button>
                </div>

                <button id="btn-go-app" onClick={() => navigate(getRedirectUrl())}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all">
                  Masuk ke Dashboard 🌾
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-green-700 font-bold transition-colors">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}