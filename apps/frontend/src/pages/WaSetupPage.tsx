import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

type SessionStatus = 'loading' | 'valid' | 'completed' | 'not_found' | 'error';
type SetupStep = 'idle' | 'connecting' | 'success' | 'puter_error';

interface SessionData {
  purpose: 'connect-puter' | 'relink' | 'full-setup';
  phone?: string;
  lid?: string;
  userName?: string;
}

const purposeMessages = {
  'connect-puter': {
    title: 'Hubungkan Puter.com ke AgriHub',
    desc: 'Akun AgriHub Anda sudah terdaftar! Satu langkah lagi: hubungkan akun Puter.com agar bisa menggunakan AsistenTani AI via WhatsApp.',
    icon: '🔌',
    cta: 'Hubungkan Puter.com Sekarang',
  },
  'relink': {
    title: 'Perbarui Identitas WhatsApp',
    desc: 'Identitas WhatsApp Anda perlu diperbarui. Hubungkan Puter.com untuk memverifikasi dan memperbarui data.',
    icon: '🔄',
    cta: 'Perbarui & Hubungkan',
  },
  'full-setup': {
    title: 'Selamat Datang di AgriHub! 🌾',
    desc: 'Belum punya akun? Tidak apa-apa! Hubungkan akun Puter.com dan kami akan otomatis membuat akun AgriHub serta menautkan WhatsApp Anda — semuanya dalam satu langkah!',
    icon: '✨',
    cta: 'Daftar & Hubungkan Sekarang',
  },
};

export default function WaSetupPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const botPhone = searchParams.get('bot') || '';

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [step, setStep] = useState<SetupStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (!sessionId) {
      setSessionStatus('not_found');
      return;
    }
    api.get(`/auth/wa-magic-session/${sessionId}`)
      .then(r => {
        setSessionData(r.data.data);
        setSessionStatus('valid');
      })
      .catch(err => {
        if (err.response?.status === 410) setSessionStatus('completed');
        else if (err.response?.status === 404) setSessionStatus('not_found');
        else setSessionStatus('error');
      });
  }, [sessionId]);

  const handleConnect = async () => {
    if (!sessionId) return;
    setStep('connecting');
    setErrorMsg('');

    try {
      // Load Puter SDK dynamically
      const puter = (window as any).puter;
      if (!puter) throw new Error('Puter SDK tidak tersedia');

      // Trigger Puter OAuth sign-in
      const puterUser = await puter.auth.signIn();
      if (!puterUser) throw new Error('Login Puter dibatalkan');

      const puterToken = puterUser.token || puter.auth.getToken?.() || puterUser.auth_token;
      const puterUserId = puterUser.username || puterUser.uuid || puterUser.id;
      const puterName = puterUser.username || puterUser.email || 'Pengguna Baru';

      if (!puterToken) throw new Error('Gagal mendapatkan token dari Puter');

      // Complete session
      const res = await api.post(`/auth/wa-magic-session/${sessionId}/complete`, {
        puter_token: puterToken,
        puter_user_id: puterUserId,
        puter_name: puterName,
      });

      if (res.data.success) {
        // Simpan login state
        setAuth(res.data.data.user, res.data.data.token);
        setStep('success');
      } else {
        throw new Error(res.data.error || 'Gagal menyelesaikan setup');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Terjadi kesalahan';
      setErrorMsg(msg);
      setStep('puter_error');
    }
  };

  const handleReturnToWA = () => {
    if (botPhone) {
      window.location.href = `https://wa.me/${botPhone}`;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        padding: '2.5rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌾</div>
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>AgriHub</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Asisten Pertanian Digital</p>
        </div>

        {/* Loading */}
        {sessionStatus === 'loading' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
            <p>Memuat informasi sesi...</p>
          </div>
        )}

        {/* Session already completed */}
        {sessionStatus === 'completed' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.75rem' }}>Sudah Selesai!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Tautan ini sudah digunakan dan tidak aktif lagi. Akun Anda telah berhasil dihubungkan!
            </p>
            {botPhone && (
              <button onClick={handleReturnToWA} style={btnStyle('#25D366')}>
                💬 Kembali ke WhatsApp
              </button>
            )}
          </div>
        )}

        {/* Not found */}
        {sessionStatus === 'not_found' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h2 style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.75rem' }}>Tautan Tidak Ditemukan</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Tautan yang Anda buka tidak valid. Silakan minta link baru melalui WhatsApp dengan mengirimi bot pesan apa saja.
            </p>
          </div>
        )}

        {/* Valid session — show setup UI */}
        {sessionStatus === 'valid' && sessionData && (() => {
          const msg = purposeMessages[sessionData.purpose];
          return (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                  {step === 'success' ? '🎉' : msg.icon}
                </div>
                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {step === 'success' ? 'Berhasil!' : msg.title}
                </h2>
                {sessionData.userName && step === 'idle' && (
                  <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Halo, {sessionData.userName}! 👋
                  </p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {step === 'success'
                    ? 'Puter.com berhasil dihubungkan! WhatsApp Anda sudah tertaut ke AgriHub. Sekarang Anda bisa chatbot dengan AsistenTani! 🌱'
                    : msg.desc}
                </p>
              </div>

              {/* Phone info */}
              {sessionData.phone && step === 'idle' && (
                <div style={{
                  background: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>📱</span>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Nomor WA Terdeteksi</div>
                    <div style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.95rem' }}>+{sessionData.phone}</div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {step === 'puter_error' && (
                <div style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}>
                  <strong>⚠️ Gagal:</strong> {errorMsg}<br />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    Tautan masih aktif. Silakan coba lagi.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              {step !== 'success' && (
                <button
                  id="wa-connect-puter-btn"
                  onClick={handleConnect}
                  disabled={step === 'connecting'}
                  style={btnStyle('#4ade80', step === 'connecting')}
                >
                  {step === 'connecting' ? '⏳ Menghubungkan...' : (step === 'puter_error' ? '🔄 Coba Lagi' : `${msg.icon} ${msg.cta}`)}
                </button>
              )}

              {step === 'success' && botPhone && (
                <button id="wa-return-btn" onClick={handleReturnToWA} style={btnStyle('#25D366')}>
                  💬 Kembali ke WhatsApp & Chat!
                </button>
              )}

              {/* Info note */}
              {step === 'idle' && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
                  🔒 Tautan ini dienkripsi dan hanya bisa digunakan sekali.<br />
                  Token Puter.com Anda disimpan dengan aman di server kami.
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function btnStyle(color: string, disabled = false): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '0.9rem',
    background: disabled ? 'rgba(255,255,255,0.1)' : color,
    color: disabled ? 'rgba(255,255,255,0.4)' : (color === '#25D366' ? '#fff' : '#0f2027'),
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginBottom: '0.5rem',
  };
}
