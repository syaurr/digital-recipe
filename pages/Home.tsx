// 🟢 FILE: src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 👇 Import tetap aman (../)
import { supabase } from '../services/supabaseClient'; 
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const Home = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // Data Kategori
  const [loading, setLoading] = useState(true);

  // State untuk Fitur Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Ambil Data Resep
      const { data: dataResep } = await supabase
        .from('resep')
        .select(`*, kategori(nama)`)
        .order('created_at', { ascending: false });

      // 2. Ambil Data Kategori
      const { data: dataKategori } = await supabase
        .from('kategori')
        .select('*')
        .order('nama', { ascending: true });

      setRecipes(dataResep || []);
      setCategories(dataKategori || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- LOGIKA FILTER PINTAR ---
  const filteredRecipes = recipes.filter((recipe) => {
    // 1. Cek Pencarian (Nama Resep)
    const matchSearch = recipe.nama.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Cek Kategori
    const matchCategory = selectedCategory === "Semua" || recipe.kategori?.nama === selectedCategory;

    return matchSearch && matchCategory;
  });

  if (loading) return <Layout title="Loading..."><div className="text-center p-20">Memuat Menu...</div></Layout>;

  return (
    <Layout title="Galeri Resep">
      <div className="text-center mb-8 pt-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Mau Masak Apa Hari Ini? 🍣</h1>
        <p className="text-gray-600">Temukan inspirasi menu terbaik dari Balista</p>
      </div>

      {/* --- BAGIAN PENCARIAN & FILTER --- */}
      <div className="max-w-4xl mx-auto mb-10 px-4">
        
        {/* Kolom Pencarian */}
        <div className="relative mb-6">
          <input 
            type="text"
            placeholder="Cari menu (contoh: Ramen, Sushi, Tea)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all pl-12"
          />
          <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
        </div>

        {/* Tombol Kategori */}
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setSelectedCategory("Semua")}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              selectedCategory === "Semua" 
              ? "bg-green-600 text-white shadow-md transform scale-105" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
            }`}
          >
            Semua
          </button>
          
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.nama)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === cat.nama 
                ? "bg-green-600 text-white shadow-md transform scale-105" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
              }`}
            >
              {cat.nama}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRID RESEP --- */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl mx-4">
          <p className="text-gray-500 text-xl font-medium">Menu tidak ditemukan.</p>
          <button 
            onClick={() => {setSearchQuery(""); setSelectedCategory("Semua");}}
            className="mt-2 text-green-600 font-bold hover:underline"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12 px-4">
          {filteredRecipes.map((r) => (
            <Link to={`/resep/${r.id}`} key={r.id} className="group block h-full">
              <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full border border-gray-100 flex flex-col overflow-hidden">
                <div className="h-48 overflow-hidden bg-gray-200 relative">
                  <img 
                    src={getGoogleDriveImageUrl(r.foto_url)} 
                    alt={r.nama} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }}
                  />
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                    {r.kategori?.nama || 'UMUM'}
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-green-600">
                    {r.nama}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-4 flex-grow">
                    {r.deskripsi || "Lihat detail..."}
                  </p>
                  <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                     <span className="text-gray-400">Lihat Detail</span>
                     <span className="text-green-600 font-bold">Buka →</span>
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