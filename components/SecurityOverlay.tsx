import React, { useState, useEffect } from 'react';

/**
 * SecurityOverlay
 * Menampilkan overlay "Aplikasi Terkunci" saat window kehilangan fokus
 * (user berpindah tab, minimize, atau screen blur).
 * Menggunakan visibilitychange + blur event listener.
 */
const SecurityOverlay: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    const handleWindowBlur = () => {
      setIsLocked(true);
    };

    const handleWindowFocus = () => {
      setIsLocked(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  if (!isLocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(3, 63, 63, 0.93)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Ikon Gembok */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(205, 91, 25, 0.15)',
          border: '2px solid rgba(205, 91, 25, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(205, 91, 25, 0.25)',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(205, 91, 25, 0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {/* Judul */}
      <h2
        style={{
          color: '#f2d086',
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 8,
          fontFamily: 'Inter, Poppins, sans-serif',
        }}
      >
        Aplikasi Terkunci
      </h2>

      {/* Subteks & Legal Warning */}
      <div style={{ textAlign: 'center', marginTop: 16, maxWidth: '80%' }}>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            fontFamily: 'Inter, Poppins, sans-serif',
            marginBottom: 24,
          }}
        >
          Klik di area mana saja untuk melanjutkan
        </p>

        <div style={{
          background: 'rgba(214, 48, 42, 0.1)',
          border: '1px solid rgba(214, 48, 42, 0.3)',
          borderRadius: 16,
          padding: '16px 20px',
        }}>
          <p
            style={{
              color: '#d6302a',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'Inter, Poppins, sans-serif',
              marginBottom: 8,
            }}
          >
            ⚠️ Peringatan Keamanan & Hukum
          </p>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.65rem',
              lineHeight: 1.5,
              fontWeight: 400,
              fontFamily: 'Inter, Poppins, sans-serif',
              margin: 0,
            }}
          >
            Seluruh data resep di dalam sistem ini merupakan <strong>Rahasia Dagang (Trade Secret)</strong> milik Balista Sushi & Tea. 
            Mendistribusikan, menyalin, atau membocorkan informasi ini tanpa izin merupakan tindak pidana yang dapat dituntut berdasarkan <strong>UU No. 30 Tahun 2000 tentang Rahasia Dagang</strong> dan <strong>UU ITE</strong>. Sistem secara aktif mencatat aktivitas akses Anda.
          </p>
        </div>
      </div>

      {/* Divider garis tipis */}
      <div
        style={{
          width: 80,
          height: 1,
          background: 'rgba(205, 91, 25, 0.3)',
          marginTop: 24,
          marginBottom: 16,
          borderRadius: 999,
        }}
      />

      {/* Badge Balista */}
      <p
        style={{
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontFamily: 'Inter, Poppins, sans-serif',
        }}
      >
        Balista Sushi & Tea
      </p>
    </div>
  );
};

export default SecurityOverlay;
