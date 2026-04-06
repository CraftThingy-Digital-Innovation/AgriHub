import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Edit3, X, Check, 
  ArrowRight, Loader2, Camera, UserCheck, AlertCircle 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../store/useModalStore';
import api from '../lib/api';

type Step = 'view' | 'edit' | 'verify';

export const ProfileModal: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { profile, closeProfile, showAlert } = useModalStore();
  
  const [step, setStep] = useState<Step>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || ''
  });

  const [otp, setOtp] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<{ type: 'phone' | 'email', value: string } | null>(null);

  useEffect(() => {
    if (profile.isOpen) {
      setStep('view');
      setFormData({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar_url: user?.avatar_url || ''
      });
      setError('');
    }
  }, [profile.isOpen, user]);

  const handleUpdateBasic = async () => {
    setLoading(true);
    setError('');
    try {
      // If phone or email changed, we handle that via OTP flow
      const phoneChanged = formData.phone !== user?.phone;
      const emailChanged = formData.email !== user?.email;

      if (phoneChanged || emailChanged) {
        const type = phoneChanged ? 'phone' : 'email';
        const value = phoneChanged ? formData.phone : formData.email;
        
        const { data } = await api.post('/auth/request-profile-otp', { type, value });
        if (data.success) {
          setVerifyTarget({ type, value });
          setStep('verify');
        }
      } else {
        // Just basic update
        const { data } = await api.patch('/auth/profile', {
          name: formData.name,
          username: formData.username,
          avatar_url: formData.avatar_url
        });
        if (data.success) {
          updateUser(data.data.user);
          setStep('view');
          showAlert('Profil berhasil diperbarui!');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verifyTarget) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/verify-profile-otp', {
        type: verifyTarget.type,
        value: verifyTarget.value,
        otp
      });
      if (data.success) {
        updateUser(data.data.user);
        // After verifying one, check if the OTHER also needs verification
        const otherType = verifyTarget.type === 'phone' ? 'email' : 'phone';
        const otherValue = otherType === 'phone' ? formData.phone : formData.email;
        const otherChanged = otherValue !== user?.[otherType];

        if (otherChanged) {
           const { data: nextReq } = await api.post('/auth/request-profile-otp', { type: otherType, value: otherValue });
           if (nextReq.success) {
             setVerifyTarget({ type: otherType, value: otherValue });
             setOtp('');
             showAlert(`Verifikasi ${verifyTarget.type} berhasil. Sekarang masukkan kode untuk ${otherType}.`);
             return;
           }
        }

        // All done? Apply basic updates too if any
        await api.patch('/auth/profile', {
            name: formData.name,
            username: formData.username,
            avatar_url: formData.avatar_url
        });
        
        const { data: finalUser } = await api.get('/auth/me');
        updateUser(finalUser.data.user);
        
        setStep('view');
        showAlert('Profil dan kontak berhasil diperbarui!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kode OTP salah');
    } finally {
      setLoading(false);
    }
  };

  if (!profile.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-green-600 to-emerald-500 p-6">
          <button 
            onClick={closeProfile}
            className="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
          >
            <X size={20} />
          </button>
          
          <div className="absolute -bottom-10 left-8 flex items-end gap-4">
             <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} className="w-full h-full object-cover rounded-[1.25rem]" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-600 font-black text-3xl">
                      {user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                {step === 'edit' && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Camera size={14} />
                  </button>
                )}
             </div>
             <div className="pb-2 text-white drop-shadow-md">
                <h2 className="font-black text-xl leading-tight">{user?.name}</h2>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">@{user?.username}</p>
             </div>
          </div>
        </div>

        <div className="p-8 pt-16">
          <AnimatePresence mode="wait">
            {step === 'view' && (
              <motion.div key="view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Telepon', value: user?.phone, icon: <Phone size={14} /> },
                    { label: 'Email', value: user?.email || 'Belum diatur', icon: <Mail size={14} /> },
                    { label: 'Role Akun', value: user?.role, icon: <Shield size={14} />, capitalize: true }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="text-emerald-600 opacity-60">{item.icon}</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className={`text-sm font-bold text-slate-800 ${item.capitalize ? 'capitalize' : ''}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setStep('edit')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <Edit3 size={18} /> Edit Profil
                </button>
              </motion.div>
            )}

            {step === 'edit' && (
              <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="space-y-4">
                  {[
                    { key: 'name', label: 'Nama Lengkap', icon: <User size={16} /> },
                    { key: 'username', label: 'Username', icon: <AtSign size={16} /> },
                    { key: 'email', label: 'Email', icon: <Mail size={16} />, type: 'email' },
                    { key: 'phone', label: 'Nomor WhatsApp', icon: <Phone size={16} /> }
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50">
                          {field.icon}
                        </div>
                        <input 
                          type={field.type || 'text'}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                          value={(formData as any)[field.key]}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setStep('view')}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleUpdateBasic}
                    disabled={loading}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Perubahan'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div key="verify" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <Shield size={32} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl">Verifikasi Diperlukan</h3>
                  <p className="text-sm text-slate-500 font-medium px-4 mt-2 leading-relaxed">
                    Kami telah mengirim kode OTP ke {verifyTarget?.type === 'phone' ? 'WhatsApp' : 'Email'} baru Anda: <br/>
                    <span className="text-emerald-600 font-bold">{verifyTarget?.value}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="Masukkan 6 digit OTP"
                    className="w-full py-4 bg-slate-50 border border-emerald-100 rounded-2xl text-center text-2xl font-black tracking-[0.5em] text-emerald-800 outline-none focus:ring-4 focus:ring-emerald-500/10"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  
                  {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                  
                  <button 
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 6 || loading}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi & Simpan'}
                  </button>
                  
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Tidak menerima kode? <button className="text-emerald-600 underline">Kirim Ulang</button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const AtSign = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5 a3 3 0 0 0 6 0v-1 a10 10 0 1 0 -3.92 7.94" />
  </svg>
);
