import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { getFriendlyErrorMessage } from '../services/errorUtils';
import toast from 'react-hot-toast';
import ParticleBackground from '../components/ParticleBackground';

// ─── Icon Components ──────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// ─── System Error Modal ───────────────────────────────────────────────────────

interface SystemErrorModalProps {
  onClose: () => void;
}

const SystemErrorModal: React.FC<SystemErrorModalProps> = ({ onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(3,63,63,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.3s ease-out',
    }}
  >
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(214,48,42,0.4)',
      borderRadius: 24,
      padding: '40px 32px',
      maxWidth: 380,
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4), 0 0 0 1px rgba(214,48,42,0.2)',
      animation: 'slideUp 0.4s ease-out',
    }}>
      {/* Ikon Warning */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(214,48,42,0.15)',
        border: '2px solid rgba(214,48,42,0.4)',
        margin: '0 auto 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulseGlow 2s infinite',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(214,48,42,0.9)" strokeWidth="2" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h2 style={{ color: '#f2d086', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
        ⚠ Sistem Bermasalah
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
        Sistem sedang mengalami gangguan.<br />
        <strong style={{ color: '#f2d086' }}>Segera hubungi manajemen</strong> untuk mendapatkan bantuan teknis.
      </p>

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '12px 24px',
          background: 'rgba(205,91,25,0.2)',
          border: '1px solid rgba(205,91,25,0.4)',
          borderRadius: 12, color: '#f2d086',
          fontSize: '0.75rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'all 0.3s ease',
          fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(205,91,25,0.35)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(205,91,25,0.2)'; }}
      >
        Tutup
      </button>
    </div>
  </div>
);

// ─── Main Login Component ─────────────────────────────────────────────────────

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSystemError, setShowSystemError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('Login must be used within an AuthProvider');
  }
  const { session, loading: authLoading } = authContext;

  useEffect(() => {
    // Animasi mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto redirect jika sudah login
  useEffect(() => {
    if (!authLoading && session) {
      const userEmail = session.user.email?.toLowerCase() || '';
      if (userEmail === 'tasya.officebalista@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [session, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const userEmail = data.user.email?.toLowerCase() || '';

        // Ambil data profile
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            localStorage.setItem('userProfile', JSON.stringify(profile));
          }
        } catch {
          // Profile fetch gagal bukan halangan login
        }

        toast.success('Selamat datang! 🎉', {
          style: {
            borderRadius: '16px',
            background: 'rgba(3,63,63,0.9)',
            backdropFilter: 'blur(12px)',
            color: '#f2d086',
            fontWeight: '700',
            border: '1px solid rgba(242,208,134,0.2)',
          },
          icon: '✦',
        });

        // Redirect berdasarkan email
        if (userEmail === 'tasya.officebalista@gmail.com') {
          window.location.replace('/admin');
        } else {
          window.location.replace('/');
        }
      }
    } catch (err: any) {
      const { type, message } = getFriendlyErrorMessage(err);

      if (type === 'auth') {
        // Toast merah untuk salah password/email
        toast.error(message, {
          style: {
            borderRadius: '16px',
            background: 'rgba(214,48,42,0.92)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            fontWeight: '700',
            border: '1px solid rgba(255,100,100,0.3)',
          },
          icon: '✕',
          duration: 4000,
        });
      } else {
        // Modal besar untuk network error / server down
        setShowSystemError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state awal (verifikasi session)
  if (authLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ background: 'linear-gradient(135deg, #033f3f 0%, #054f4f 50%, #033f3f 100%)' }}
      >
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-balista-accent border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-balista-accent/70 font-bold uppercase tracking-widest text-xs">
            Memverifikasi Sesi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #033f3f 0%, #054f4f 40%, #02302f 100%)' }}
    >
      {/* System Error Modal */}
      {showSystemError && <SystemErrorModal onClose={() => setShowSystemError(false)} />}

      {/* Orb Background */}
      <ParticleBackground />

      {/* ─── Login Card ─── */}
      <div
        className="relative z-10 w-full max-w-[400px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Card Glass */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 28,
            padding: '40px 36px',
            boxShadow: '0 32px 80px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="animate-float"
              style={{
                width: 80, height: 80,
                borderRadius: 22,
                overflow: 'hidden',
                marginBottom: 16,
                boxShadow: '0 16px 40px rgba(0,0,0,0.3), 0 0 0 2px rgba(242,208,134,0.2)',
              }}
            >
              <img
                src="/logo.png"
                alt="Balista Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.style.background = '#cd5b19';
                  e.currentTarget.parentElement!.style.display = 'flex';
                  e.currentTarget.parentElement!.style.alignItems = 'center';
                  e.currentTarget.parentElement!.style.justifyContent = 'center';
                  e.currentTarget.parentElement!.innerHTML += '<span style="color:white;font-size:28px;font-weight:900">B</span>';
                }}
              />
            </div>

            <h1
              style={{
                color: '#f2d086', fontSize: '1.2rem', fontWeight: 900,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textAlign: 'center', marginBottom: 6,
                fontFamily: 'Inter, Poppins, sans-serif',
              }}
            >
              Buku Resep Digital
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              Balista Sushi & Tea
            </p>

            {/* Divider */}
            <div style={{ width: 48, height: 2, borderRadius: 999, background: 'linear-gradient(90deg, transparent, rgba(205,91,25,0.6), transparent)', marginTop: 16 }} />
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}
              >
                Email Outlet
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                  <MailIcon />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="outlet@balista.com"
                  required
                  autoComplete="email"
                  className="input-glow"
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 44px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.border = '1px solid rgba(205,91,25,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(205,91,25,0.15), 0 0 20px rgba(205,91,25,0.05)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.12)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '13px 48px 13px 44px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.border = '1px solid rgba(205,91,25,0.5)';
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(205,91,25,0.15), 0 0 20px rgba(205,91,25,0.05)';
                  }}
                  onBlur={e => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.12)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: showPassword ? 'rgba(205,91,25,0.8)' : 'rgba(255,255,255,0.3)',
                    padding: 4, borderRadius: 8,
                    transition: 'color 0.2s ease',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(205,91,25,0.9)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = showPassword ? 'rgba(205,91,25,0.8)' : 'rgba(255,255,255,0.3)'; }}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: loading
                  ? 'rgba(205,91,25,0.4)'
                  : 'linear-gradient(135deg, #cd5b19 0%, #e06a20 50%, #cd5b19 100%)',
                backgroundSize: '200% 200%',
                border: '1px solid rgba(205,91,25,0.3)',
                borderRadius: 14,
                color: loading ? 'rgba(255,255,255,0.6)' : '#fff',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 8px 32px rgba(205,91,25,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                fontFamily: 'Inter, Poppins, sans-serif',
                marginTop: 8,
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 40px rgba(205,91,25,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 8px 32px rgba(205,91,25,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Masuk ke Galeri
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p
            style={{
              textAlign: 'center', marginTop: 24,
              color: 'rgba(255,255,255,0.18)',
              fontSize: '0.65rem', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            © 2025 Balista Sushi & Tea — Confidential
          </p>
        </div>

        {/* Glow bawah card */}
        <div
          style={{
            position: 'absolute',
            bottom: -20, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(205,91,25,0.4), transparent)',
            filter: 'blur(4px)',
          }}
        />
      </div>
    </div>
  );
};

export default Login;