import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import {
  Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2,
  AlertCircle, Mail, Shield, Phone, ArrowRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionStatus = 'loading' | 'valid' | 'completed' | 'not_found' | 'error';
type SetupStep = 'idle' | 'connecting' | 'set_password' | 'success' | 'puter_error';

// ─── Password strength utils (identical to LoginPage) ────────────────────────
const pwRules = [
  { label: 'Minimal 8 karakter',        test: (p: string) => p.length >= 8 },
  { label: 'Huruf kapital (A-Z)',        test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Huruf kecil (a-z)',          test: (p: string) => /[a-z]/.test(p) },
  { label: 'Angka (0-9)',                test: (p: string) => /\d/.test(p) },
  { label: 'Karakter spesial (!@#$…)',   test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = pwRules.filter(r => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {pwRules.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? colors[Math.min(passed - 1, 4)] : '#e5e7eb' }} />
        ))}
      </div>
      <div className="space-y-0.5">
        {pwRules.map((r, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${r.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
            {r.test(password) ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {r.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, id, label }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; id: string; label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Lock size={18} /></div>
        <input id={id} type={show ? 'text' : 'password'}
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-semibold text-green-900"
          placeholder={placeholder || 'Min. 8 karakter, huruf besar, angka, spesial'}
          value={value} onChange={e => onChange(e.target.value)} required />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-4 flex items-center text-green-400 hover:text-green-700 transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WaSetupPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const [sessionData, setSessionData] = useState<{ purpose: string; phone?: string; userName?: string; lid?: string } | null>(null);
  const [step, setStep] = useState<SetupStep>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [puterError, setPuterError] = useState('');

  // Password + email form state
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [email, setEmail] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { setAuth, updateUser } = useAuthStore();
  const token = useAuthStore(s => s.token);

  // ── Load session ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { setSessionStatus('not_found'); return; }
    api.get(`/auth/wa-magic-session/${sessionId}`)
      .then(r => { setSessionData(r.data.data); setSessionStatus('valid'); })
      .catch(err => {
        if (err.response?.data?.completed) setSessionStatus('completed');
        else setSessionStatus(err.response?.status === 404 ? 'not_found' : 'error');
      });
  }, [sessionId]);

  // ── Puter OAuth ─────────────────────────────────────────────────────────────
  async function handlePuterConnect() {
    setError(''); setPuterError('');
    setStep('connecting');
    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error('Puter SDK tidak tersedia di halaman ini');
      const puterUser = await puter.auth.signIn();
      if (!puterUser) throw new Error('Login Puter dibatalkan oleh pengguna');

      const puter_token    = puterUser.token || puterUser.auth_token;
      const puter_user_id  = puterUser.username || puterUser.uuid;
      const puter_name     = puterUser.username || puterUser.email;
      const puter_email    = puterUser.email;

      // Validation check: if no phone in session AND no manual phone provided yet
      if (!sessionData?.phone && !manualPhone && sessionData?.purpose === 'full-setup') {
        setPhoneError('Nomor HP wajib diisi untuk pendaftaran baru');
        setStep('idle');
        return;
      }

      const { data } = await api.post(`/auth/wa-magic-session/${sessionId}/complete`, {
        puter_token, puter_user_id, puter_name, puter_email,
        phone: manualPhone || undefined
      });

      // Simpan auth token agar endpoint berikutnya (set-password) bisa pakai requireAuth
      setAuth(data.data.user, data.data.token);

      // Cek apakah masih perlu set password
      if (data.data.needs_password) {
        // Pre-fill email dari Puter jika ada
        if (puter_email) setEmail(puter_email);
        setStep('set_password');
      } else {
        setStep('success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Gagal menghubungkan Puter';
      setPuterError(msg);
      setStep('puter_error');
    }
  }

  // ── Set Password ─────────────────────────────────────────────────────────────
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    if (password !== retypePassword) { setPasswordError('Password tidak cocok'); return; }
    setSavingPassword(true);
    try {
      const { data } = await api.post('/auth/wa-magic-session/set-password', {
        password,
        retype_password: retypePassword,
        email: email || undefined,
      });
      updateUser(data.data.user);
      setStep('success');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Gagal menyimpan password');
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Redirect ke WhatsApp ─────────────────────────────────────────────────────
  function redirectToWA() {
    const phone = sessionData?.phone || '';
    const botNumber = searchParams.get('bot') || '';
    if (botNumber) {
      window.location.href = `https://wa.me/${botNumber}`;
    } else {
      window.location.href = 'https://wa.me/';
    }
  }

  // ── Password validation status ───────────────────────────────────────────────
  const pwPassed = pwRules.every(r => r.test(password));
  const pwMatch  = password === retypePassword && retypePassword.length > 0;

  // ─── Render helpers ──────────────────────────────────────────────────────────
  const purposeLabel: Record<string, { title: string; sub: string; icon: string }> = {
    'connect-puter': { title: 'Hubungkan Puter.com', sub: 'Tautkan akun Puter Anda untuk menggunakan AI di WhatsApp', icon: '🔗' },
    'full-setup':    { title: 'Buat Akun AgriHub',   sub: 'Daftar otomatis & tautkan WhatsApp dalam 1 klik',         icon: '🌾' },
    'relink':        { title: 'Perbaiki Koneksi WA',  sub: 'Update identitas WhatsApp Anda yang terputus',            icon: '🔄' },
  };
  const pInfo = purposeLabel[sessionData?.purpose || ''] || { title: 'Setup AgriHub', sub: 'Hubungkan akun Anda', icon: '🌾' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-green-200 rounded-full blur-[100px] opacity-40" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-emerald-300 rounded-full blur-[100px] opacity-40" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌾</div>
            <h1 className="text-2xl font-black text-green-950">AgriHub</h1>
            <p className="text-green-600 text-sm font-medium">Ketahanan Pangan Digital</p>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Loading ───────────────────────────────────────────────── */}
            {sessionStatus === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 space-y-3">
                <Loader2 size={32} className="animate-spin text-green-500 mx-auto" />
                <p className="text-green-700 font-medium">Memuat informasi sesi...</p>
              </motion.div>
            )}

            {/* ── Not Found ─────────────────────────────────────────────── */}
            {(sessionStatus === 'not_found' || sessionStatus === 'completed') && (
              <motion.div key="notfound" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                <div className="text-5xl">{sessionStatus === 'completed' ? '✅' : '❌'}</div>
                <div>
                  <h2 className="font-black text-gray-800 text-lg">
                    {sessionStatus === 'completed' ? 'Link Sudah Digunakan' : 'Link Tidak Valid'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {sessionStatus === 'completed'
                      ? 'Setup sudah selesai. Kembali ke WhatsApp dan mulai chat!'
                      : 'Link tidak ditemukan atau sudah kadaluarsa. Minta link baru dari bot.'}
                  </p>
                </div>
                <button onClick={redirectToWA}
                  className="w-full py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all">
                  Kembali ke WhatsApp
                </button>
              </motion.div>
            )}

            {/* ── Error ────────────────────────────────────────────────── */}
            {sessionStatus === 'error' && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
                <div className="text-5xl">⚠️</div>
                <p className="text-red-600 font-bold">Terjadi kesalahan. Coba muat ulang halaman.</p>
                <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700">Muat Ulang</button>
              </motion.div>
            )}

            {/* ── Valid Session — CTA ───────────────────────────────────── */}
            {sessionStatus === 'valid' && step === 'idle' && (
              <motion.div key="cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Info card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center">
                  <div className="text-4xl mb-2">{pInfo.icon}</div>
                  <h2 className="font-black text-green-900 text-lg">{pInfo.title}</h2>
                  <p className="text-green-600 text-sm mt-1">{pInfo.sub}</p>
                  {sessionData?.phone ? (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-700">
                      <Phone size={14} />
                      <span className="font-bold">{sessionData.phone}</span>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3 text-left">
                       <div className="p-3 bg-white/50 border border-amber-200 rounded-xl text-amber-950">
                          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <Shield size={12} /> ID WhatsApp Terdeteksi
                          </p>
                          <p className="text-sm font-mono font-bold mt-0.5">{sessionData?.lid?.split('@')[0] || 'Unknown ID'}</p>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">Konfirmasi Nomor WhatsApp Anda *</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Phone size={18} /></div>
                            <input 
                              type="tel"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-green-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-bold text-green-900"
                              placeholder="08xxxxxxxxxx"
                              value={manualPhone}
                              onChange={e => { setManualPhone(e.target.value); setPhoneError(''); }}
                            />
                          </div>
                       </div>
                       
                       {phoneError && <p className="text-red-500 text-[10px] font-bold ml-1">{phoneError}</p>}
                       
                       <p className="text-[10px] text-gray-500 leading-relaxed px-1">
                         ⚠️ Karena pengaturan privasi WhatsApp Anda, nomor HP tidak terdeteksi otomatis. 
                         Masukan nomor Anda yang terdaftar di AgriHub untuk **menautkan akun** (bukan membuat akun baru).
                       </p>
                    </div>
                  )}
                </div>

                {/* Info flow */}
                <div className="space-y-2">
                  {[
                    { n: '1', label: 'Login ke Puter.com (akun AI Anda)' },
                    { n: '2', label: 'Set password untuk masuk ke website' },
                    { n: '3', label: 'Kembali ke WhatsApp & mulai chat!' },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">{s.n}</div>
                      {s.label}
                    </div>
                  ))}
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl p-3">{error}</p>}

                <button id="btn-puter-connect" onClick={handlePuterConnect} disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-3">
                  <Shield size={22} /> Hubungkan dengan Puter.com
                </button>
              </motion.div>
            )}

            {/* ── Connecting / Processing ───────────────────────────────── */}
            {step === 'connecting' && (
              <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-8">
                <Loader2 size={48} className="animate-spin text-purple-500 mx-auto" />
                <div>
                  <h2 className="font-black text-gray-800 text-lg">Menghubungkan ke Puter.com</h2>
                  <p className="text-gray-500 text-sm mt-1">Selesaikan login di jendela popup Puter…</p>
                </div>
              </motion.div>
            )}

            {/* ── Puter Error ───────────────────────────────────────────── */}
            {step === 'puter_error' && (
              <motion.div key="puter_err" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="text-5xl">😕</div>
                  <h2 className="font-black text-gray-800">Login Puter Gagal</h2>
                  <p className="text-gray-500 text-sm">{puterError}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                  <strong>💡 Tips:</strong> Link ini masih aktif dan bisa dicoba kembali sampai berhasil.
                </div>
                <button onClick={() => { setStep('idle'); setPuterError(''); }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2">
                  <ArrowRight size={18} /> Coba Lagi
                </button>
              </motion.div>
            )}

            {/* ── Set Password + Email ──────────────────────────────────── */}
            {step === 'set_password' && (
              <motion.div key="set_password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="text-center space-y-1 mb-2">
                    <div className="text-3xl">🔐</div>
                    <h2 className="font-black text-green-900 text-lg">Buat Password</h2>
                    <p className="text-green-600 text-sm">Agar bisa login ke website AgriHub kapan saja</p>
                  </div>

                  {/* Email (opsional, pre-filled dari Puter) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-green-800 uppercase tracking-widest ml-1">
                      Email <span className="text-gray-400 normal-case">(opsional, untuk verifikasi)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center text-green-600"><Mail size={18} /></div>
                      <input id="wa-setup-email" type="email"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green-50/50 border border-green-100 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-semibold text-green-900"
                        placeholder="email@contoh.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)} />
                    </div>
                    {email && (
                      <p className="text-[11px] text-green-600 ml-1">📧 Link verifikasi akan dikirim ke email ini</p>
                    )}
                  </div>

                  {/* Password */}
                  <PasswordInput id="wa-setup-password" label="Password Baru *"
                    value={password} onChange={setPassword} />
                  <PasswordStrength password={password} />

                  {/* Retype */}
                  <PasswordInput id="wa-setup-retype" label="Konfirmasi Password *"
                    placeholder="Ulangi password yang sama"
                    value={retypePassword} onChange={setRetypePassword} />

                  {/* Match indicator */}
                  {retypePassword.length > 0 && (
                    <p className={`text-[11px] flex items-center gap-1 ml-1 ${pwMatch ? 'text-green-600' : 'text-red-500'}`}>
                      {pwMatch ? <><CheckCircle2 size={12} /> Password cocok ✓</> : <><AlertCircle size={12} /> Password tidak cocok</>}
                    </p>
                  )}

                  {passwordError && (
                    <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} /> {passwordError}
                    </p>
                  )}

                  <button type="submit" id="btn-save-password"
                    disabled={savingPassword || !pwPassed || !pwMatch}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingPassword ? <Loader2 size={20} className="animate-spin" /> : '✅ Simpan & Selesai'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Success ───────────────────────────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl">🎉</motion.div>
                <div>
                  <h2 className="font-black text-green-900 text-xl">Setup Selesai!</h2>
                  <p className="text-green-600 text-sm mt-1">
                    Akun Anda sudah terhubung. Kembali ke WhatsApp dan mulai chat dengan bot AgriHub!
                  </p>
                </div>

                {/* Hint email verifikasi */}
                {email && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 text-left">
                    📧 <strong>Cek email Anda</strong> di <em>{email}</em> untuk memverifikasi email AgriHub Anda.
                  </div>
                )}

                <button id="btn-back-wa" onClick={redirectToWA}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all">
                  💬 Kembali ke WhatsApp
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
