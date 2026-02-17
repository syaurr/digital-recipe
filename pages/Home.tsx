// 🟢 FILE: src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import services dan utils
import { supabase } from '../services/supabaseClient'; 
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const Home = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: dataResep } = await supabase
          .from('resep')
          .select(`*, kategori(nama)`)
          .order('created_at', { ascending: false });
          
        const { data: dataKategori } = await supabase
          .from('kategori')
          .select('*')
          .order('nama', { ascending: true });
          
        setRecipes(dataResep || []);
        setCategories(dataKategori || []);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchSearch = recipe.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "Semua" || recipe.kategori?.nama === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) return (
    <Layout title="Loading...">
      <div className="text-center p-20 font-bold text-gray-500 animate-pulse">
        Memuat Menu Balista...
      </div>
    </Layout>
  );

  return (
    <Layout title="Galeri Resep">
      <div className="text-center mb-8 pt-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Mau Masak Apa Hari Ini? 🍣</h1>
        <p className="text-gray-600">Temukan inspirasi menu terbaik dari Balista Sushi & Tea</p>
      </div>

      {/* Filter & Search */}
      <div className="max-w-4xl mx-auto mb-10 px-4">
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Cari menu favoritmu..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full px-5 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pl-12 transition-all" 
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setSelectedCategory("Semua")} 
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${selectedCategory === "Semua" ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.nama)} 
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${selectedCategory === cat.nama ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {cat.nama}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Menu */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl mx-4">
          <p className="text-gray-400 font-medium text-lg">Menu tidak ditemukan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-12 px-4">
          {filteredRecipes.map((r) => (
            <Link to={`/resep/${r.id}`} key={r.id} className="group block h-full">
              <div className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full border border-gray-100 flex flex-col overflow-hidden">
                
                {/* Image Section */}
                <div className="h-56 overflow-hidden bg-gray-100 relative">
                  
                  {/* 👇 BAGIAN IMG YANG SUDAH DIPERBAIKI & DIBERSIHKAN 👇 */}
                  <img 
                    src={getGoogleDriveImageUrl(r.foto_url)} 
                    alt={r.nama} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x400?text=Cek+Akses+Drive";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="absolute top-4 right-4 bg-balista-secondary/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                    {r.kategori?.nama || 'UMUM'}
                  </span>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-black text-gray-800 line-clamp-1 group-hover:text-green-600 transition-colors">
                    {r.nama}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2 mb-6 flex-grow italic leading-relaxed">
                    {r.deskripsi || "Ketuk untuk melihat detail bahan dan cara pembuatan..."}
                  </p>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-300">Resep Balista</span>
                    <span className="text-green-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Buka Resep <span className="text-lg">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Home;