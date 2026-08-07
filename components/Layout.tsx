import React, { ReactNode, useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ParticleBackground from './ParticleBackground';
import SecurityOverlay from './SecurityOverlay';

interface LayoutProps {
  children?: ReactNode;
  title: string;
  hideTitle?: boolean;
}

const Layout = ({ children, title, hideTitle = false }: LayoutProps) => {
  const { profile } = useContext(AuthContext) || {};
  const [currentRole, setCurrentRole] = React.useState('crew');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // CEK ROLE SETIAP KALI HALAMAN DIBUKA
  React.useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (profile?.role === 'admin' || savedProfile?.role === 'admin') {
      setCurrentRole('admin');
    } else {
      setCurrentRole('crew');
    }
  }, [profile]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    localStorage.clear();
    // Jeda sebentar untuk animasi
    await new Promise(r => setTimeout(r, 300));
    window.location.replace('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 btn-glow ${
      isActive
        ? 'bg-balista-secondary text-white shadow-lg shadow-balista-secondary/30'
        : 'text-balista-primary/70 hover:bg-balista-secondary/10 hover:text-balista-secondary'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
      isActive
        ? 'bg-balista-secondary/15 text-balista-secondary'
        : 'text-balista-primary/60 hover:bg-balista-secondary/10 hover:text-balista-secondary'
    }`;

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #f1d9a5 0%, #fae8c0 40%, #f0dab0 100%)' }}>

      {/* ===== LAYER 0: Particle Background (orb melayang) ===== */}
      <ParticleBackground />

      {/* ===== LAYER 1: Security Overlay (blur saat app hilang fokus) ===== */}
      <SecurityOverlay />

      {/* ===== LAYER 2: Konten Utama ===== */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ─── HEADER GLASSMORPHISM ─── */}
        <header className="glass-header sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-16 md:h-20">

            {/* KIRI: Logo */}
            <div className="flex items-center space-x-3 shrink-0 animate-fade-in">
              <div className="relative">
                <img
                  src="/logo.png"
                  className="w-9 h-9 md:w-11 md:h-11 rounded-2xl object-cover shadow-md ring-2 ring-white/60"
                  alt="Balista Logo"
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=B"; }}
                />
                {/* Status dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div>
                <span className="font-black text-balista-primary uppercase tracking-tighter text-sm md:text-base italic block leading-tight">
                  Balista <span className="text-balista-secondary hidden sm:inline">Sushi & Tea</span>
                </span>
                <span className="text-[9px] font-bold text-balista-primary/40 uppercase tracking-widest hidden sm:block">
                  Digital Recipe System
                </span>
              </div>
            </div>

            {/* TENGAH: Navigasi Desktop */}
            <nav className="hidden md:flex items-center space-x-1 glass rounded-2xl p-1.5">
              <NavLink to="/" end className={navLinkClass}>
                Galeri Resep
              </NavLink>

              {currentRole === 'admin' && (
                <>
                  <NavLink to="/admin" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/kategori" className={navLinkClass}>
                    Kategori
                  </NavLink>
                  <NavLink to="/crew" className={navLinkClass}>
                    Tim
                  </NavLink>
                </>
              )}
            </nav>

            {/* KANAN: User Info & Aksi */}
            <div className="flex items-center space-x-3 md:space-x-4">

              {/* Info User */}
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] md:text-[11px] font-bold text-balista-primary/80 lowercase truncate max-w-[150px]">
                  {profile?.email || '—'}
                </p>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5 ${
                  currentRole === 'admin'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  {currentRole === 'admin' ? '⬡ Admin Office' : '◆ Crew'}
                </span>
              </div>

              {/* Tombol Logout Desktop */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden sm:flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white
                           px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest
                           transition-all duration-300 disabled:opacity-50 btn-glow"
              >
                {isLoggingOut ? (
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                )}
                Keluar
              </button>

              {/* Hamburger Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden glass p-2.5 rounded-xl text-balista-primary hover:bg-white/30 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
              isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 py-4 space-y-1 border-t border-white/30">

              {/* User Info Mobile */}
              <div className="flex items-center justify-between py-3 mb-2 border-b border-white/20">
                <div>
                  <p className="text-xs font-bold text-balista-primary/80 lowercase truncate max-w-[200px]">
                    {profile?.email || '—'}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    currentRole === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {currentRole === 'admin' ? '⬡ Admin Office' : '◆ Crew'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Keluar
                </button>
              </div>

              {/* Nav Links Mobile */}
              <nav className="flex flex-col space-y-1">
                <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  Galeri Resep
                </NavLink>
                {currentRole === 'admin' && (
                  <>
                    <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                      Dashboard Admin
                    </NavLink>
                    <NavLink to="/admin/kategori" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                      Kelola Kategori
                    </NavLink>
                    <NavLink to="/crew" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClass}>
                      Manajemen Tim
                    </NavLink>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* ─── KONTEN UTAMA ─── */}
        <main className="flex-1 container mx-auto px-4 lg:px-8 py-6 md:py-10">
          {!hideTitle && title && (
            <div className="mb-8 animate-slide-up">
              <h1 className="text-2xl md:text-4xl font-black text-balista-primary tracking-tighter uppercase italic leading-tight">
                {title}
              </h1>
              <div className="h-1 w-16 rounded-full bg-balista-secondary mt-3 shadow-sm shadow-balista-secondary/30" />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;