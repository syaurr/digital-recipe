import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const Home = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resep')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error("Gagal memuat resep:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Semua', 'Mentai Rice', 'Minuman', 'Ramen', 'Sushi Reguler', 'Takoyaki & Okonomiyaki'];

  /**
   * FILTER DATA:
   * 1. Saring berdasarkan kategori.
   * 2. Saring hanya menu yang memiliki foto (Mengecualikan data NULL di Supabase)
   */
  const filteredRecipes = recipes
    .filter(r => {
      if (filter === 'Semua') return true;
      return (r.kategori || '').toLowerCase().trim() === filter.toLowerCase().trim();
    })
    .filter(r => {
      // Hanya tampilkan jika foto_url ada isinya dan bukan 'NULL'
      return r.foto_url && r.foto_url !== 'NULL' && r.foto_url.trim() !== "";
    });

  return (
    <Layout title="Galeri Resep Balista">
      <div className="pb-24 text-left font-sans">
        
        {/* Navigasi Filter Kategori */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                filter === cat 
                ? 'bg-[#d35400] text-white shadow-lg' 
                : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Menampilkan Menu */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-[400px] bg-white rounded-[45px] animate-pulse border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((resep) => (
                <Link 
                  to={`/resep/${resep.id}`} 
                  key={resep.id}
                  className="group bg-white rounded-[45px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-gray-50 flex flex-col h-full"
                >
                  <div className="relative h-[240px] overflow-hidden m-4 rounded-[35px] bg-gray-50 shadow-inner">
                    <img 
                      // Memanggil fungsi konversi dengan parameter dari kolom foto_url Supabase
                      src={getGoogleDriveImageUrl(resep.foto_url)} 
                      alt={resep.nama}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-[#d35400] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg italic">
                        {resep.kategori || 'MENU'}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 pt-2 flex-grow flex flex-col">
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-3 leading-tight group-hover:text-[#d35400] italic">
                      {resep.nama}
                    </h3>
                    <p className="text-gray-400 text-[12px] font-bold leading-relaxed italic mb-8 line-clamp-2">
                      {resep.deskripsi || 'SOP Menu Balista Sushi & Tea.'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Resep Balista</span>
                      <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter transition-all group-hover:gap-3">
                        Buka Resep →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white/50 rounded-[50px] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] mb-4 italic">
                  Belum ada menu dengan foto untuk kategori ini
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;