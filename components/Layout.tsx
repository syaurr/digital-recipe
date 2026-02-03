import React, { ReactNode, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { isSupabaseConfigured } from '../services/supabaseClient';
// Baris import gemini dihapus supaya tidak error

interface LayoutProps {
  children?: ReactNode;
  title: string;
}

const BalistaLogo = () => (
    <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Balista Logo" className="w-10 h-10 rounded-full object-cover" />
        <span className="text-l font-bold text-balista-primary dark:text-balista-accent">Balista Sushi & Tea</span>
    </div>
);

const ConfigWarningBanner = () => {
    const warnings = [];
    if (!isSupabaseConfigured) {
        warnings.push("Supabase (URL/Key)");
    }
    // Pengecekan Gemini dihapus sementara

    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className="bg-balista-danger text-white p-3 text-center text-sm fixed top-0 w-full z-50 shadow-lg">
            <strong><span className="animate-pulse mr-2">⚠️</span>Konfigurasi Diperlukan:</strong> Kunci untuk {warnings.join(' & ')} tidak ditemukan. Aplikasi tidak akan berfungsi dengan benar. Silakan atur variabel di file <code>.env</code> Anda.
        </div>
    );
};


const Layout = ({ children, title }: LayoutProps) => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('Layout must be used within an AuthProvider');
  }
  const { signOut, profile } = authContext;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Anda telah berhasil keluar.');
      navigate('/login');
    } catch (error) {
      toast.error('Gagal keluar, coba lagi.');
    }
  };

  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium text-balista-primary dark:text-balista-light hover:bg-balista-accent/50 dark:hover:bg-balista-muted/50 transition-colors";
  const activeNavLinkClasses = "bg-balista-accent dark:bg-balista-muted";
  
  // Hapus isGeminiConfigured dari sini juga
  const showBanner = !isSupabaseConfigured; 

  return (
    <div className="min-h-screen bg-balista-background dark:bg-balista-primary text-balista-primary dark:text-balista-background">
      <ConfigWarningBanner />
      <header className={`bg-white/80 dark:bg-balista-primary/80 backdrop-blur-sm shadow-md sticky top-0 z-10 ${showBanner ? 'mt-12' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <BalistaLogo />
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
              >
                Galeri Resep
              </NavLink>
              {profile?.role === 'admin' && (
                <>
                  <NavLink 
                    to="/admin" 
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                  >
                    Admin Dashboard
                  </NavLink>
                  <NavLink 
                    to="/admin/kategori" 
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                  >
                    Kelola Kategori
                  </NavLink>
                </>
              )}
            </nav>
            <div className="flex items-center">
              <span className="text-sm mr-4 hidden sm:inline">{profile?.email} ({profile?.role})</span>
              <button
                onClick={handleSignOut}
                className="bg-balista-danger hover:bg-balista-danger-dark text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-balista-danger transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold mb-6 text-balista-primary dark:text-balista-light">{title}</h2>
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;