import React, { ReactNode, useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface LayoutProps {
  children?: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { profile } = useContext(AuthContext) || {};
  const [currentRole, setCurrentRole] = React.useState('crew');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // CEK ROLE SETIAP KALI HALAMAN DIBUKA
  React.useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (profile?.role === 'admin' || savedProfile?.role === 'admin') {
      setCurrentRole('admin');
    } else {
      setCurrentRole('crew');
    }
  }, [profile]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/login');
  };

  return (
    <div className="min-h-screen bg-balista-background font-sans">
      
      {/* PERBAIKAN 1: Z-Index diturunkan dari 9999 ke 40. 
        Ini akan membiarkan Modal (z-100) dan Toaster Notifikasi (z-9999) tampil di atas Header.
      */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-16 md:h-20">
          
          {/* KIRI: Logo */}
          <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
            <img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" alt="logo" onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=Balista" }} />
            <span className="font-black text-gray-800 uppercase tracking-tighter text-sm md:text-lg italic">
              Balista <span className="hidden sm:inline text-[#d35400]">Sushi & Tea</span>
            </span>
          </div>

          {/* TENGAH: Navigasi Desktop */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink to="/" end className={({ isActive }) => `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#d35400] text-white shadow-md' : 'text-gray-400 hover:bg-orange-50 hover:text-[#d35400]'}`}>
              Galeri Resep
            </NavLink>
            
            {currentRole === 'admin' && (
              <>
                <NavLink to="/admin" className={({ isActive }) => `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#d35400] text-white shadow-md' : 'text-gray-400 hover:bg-orange-50 hover:text-[#d35400]'}`}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/kategori" className={({ isActive }) => `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#d35400] text-white shadow-md' : 'text-gray-400 hover:bg-orange-50 hover:text-[#d35400]'}`}>
                  Kategori
                </NavLink>
              </>
            )}
          </nav>

          {/* KANAN: User Info & Tombol Mobile Menu */}
          <div className="flex items-center space-x-3 md:space-x-4 text-right">
             
             {/* Info User: Disembunyikan di layar sangat kecil agar tidak merusak layout */}
             <div className="hidden sm:block">
                <p className="text-[10px] md:text-xs font-bold text-gray-800 lowercase truncate max-w-[120px] md:max-w-[200px]">{profile?.email || 'admin@balista.com'}</p>
                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${currentRole === 'admin' ? 'text-blue-600' : 'text-green-600'}`}>
                  {currentRole === 'admin' ? '(ADMIN OFFICE)' : '(CREW)'}
                </p>
             </div>
             
             <button onClick={handleLogout} className="hidden sm:block bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all">
               KELUAR
             </button>
             
             {/* PERBAIKAN 2: Tombol Hamburger Menu untuk Mobile */}
             <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden bg-gray-50 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all focus:ring-2 focus:ring-orange-200"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
             </button>
          </div>
        </div>

        {/* PERBAIKAN 3: Isi Menu Dropdown Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 shadow-lg absolute w-full z-50">
            {/* Info User di Mobile */}
            <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-50">
               <div>
                  <p className="text-xs font-bold text-gray-800 lowercase truncate max-w-[200px]">{profile?.email || 'admin@balista.com'}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${currentRole === 'admin' ? 'text-blue-600' : 'text-green-600'}`}>
                    {currentRole === 'admin' ? '(ADMIN OFFICE)' : '(CREW)'}
                  </p>
               </div>
               <button onClick={handleLogout} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                 KELUAR
               </button>
            </div>
            
            {/* Link Navigasi Mobile */}
            <nav className="flex flex-col space-y-1">
              <NavLink to="/" end onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-orange-50 text-[#d35400]' : 'text-gray-500 hover:bg-gray-50'}`}>
                Galeri Resep
              </NavLink>
              
              {currentRole === 'admin' && (
                <>
                  <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-orange-50 text-[#d35400]' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Dashboard Admin
                  </NavLink>
                  <NavLink to="/admin/kategori" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-orange-50 text-[#d35400]' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Kelola Kategori
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Konten Utama */}
      <main className="container mx-auto px-4 lg:px-8 py-6 md:py-8">
        <h2 className="hidden md:block text-2xl md:text-3xl font-black mb-6 md:mb-8 text-gray-800 tracking-tighter uppercase italic">{title}</h2>
        {children}
      </main>
    </div>
  );
};

export default Layout;