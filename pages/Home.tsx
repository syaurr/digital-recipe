import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Resep, Kategori } from '../types';
import Layout from '../components/Layout';
import { getSupabaseErrorMessage } from '../services/errorUtils';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const Home = () => {
  const [recipes, setRecipes] = useState<Resep[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("[HOME] Memulai fetch data...");

        // 1. Ambil Kategori
        const catResponse = await supabase
          .from('kategori')
          .select('*')
          .order('nama', { ascending: true });

        console.log("[HOME] Hasil Kategori:", catResponse);

        if (catResponse.error) {
            console.error("[HOME] Error Kategori:", catResponse.error);
        } else {
            setCategories(catResponse.data || []);
        }

        // 2. Ambil Resep
        // Kita hapus spasi di .select() agar manual fetcher tidak bingung
        const recipeResponse = await supabase
          .from('resep')
          .select(`id,nama,foto_url,kategori_id,kategori(nama)`)
          .order('created_at', { ascending: false });

        console.log("[HOME] Hasil Resep:", recipeResponse);

        if (recipeResponse.error) {
             throw recipeResponse.error; // Lempar error agar masuk catch
        }
        
        setRecipes(recipeResponse.data as any[] as Resep[]);

      } catch (err: any) {
        console.error('[HOME] FATAL ERROR:', err);
        const msg = getSupabaseErrorMessage(err, 'Gagal memuat data.');
        setError(msg);
      } finally {
        // PENTING: Loading dimatikan apapun yang terjadi
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => {
        if (prev.includes(categoryId)) {
            return prev.filter(id => id !== categoryId);
        } else {
            return [...prev, categoryId];
        }
    });
  };

  const filteredRecipes = useMemo(() => {
    let tempRecipes = recipes;
    
    if (selectedCategories.length > 0) {
        tempRecipes = tempRecipes.filter(recipe => selectedCategories.includes(recipe.kategori_id));
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        return tempRecipes.filter(recipe => {
            const nameMatch = recipe.nama.toLowerCase().includes(lowercasedQuery);
            const categoryMatch = recipe.kategori?.nama.toLowerCase().includes(lowercasedQuery);
            return nameMatch || categoryMatch;
        });
    }

    return tempRecipes;
  }, [recipes, searchQuery, selectedCategories]);

  if (loading) {
    return <Layout title="Galeri Resep"><div className="text-center p-10 animate-pulse">Sedang memuat resep...</div></Layout>;
  }

  if (error) {
    return (
        <Layout title="Galeri Resep">
            <div className="text-center text-balista-danger p-4 bg-red-100 dark:bg-balista-danger-dark rounded-md border border-red-400">
                <h3 className="font-bold">Terjadi Kesalahan</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Coba Lagi
                </button>
            </div>
        </Layout>
    );
  }

  return (
    <Layout title="Galeri Resep">
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Cari resep berdasarkan nama atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-balista-muted/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-balista-secondary bg-white dark:bg-balista-primary dark:border-balista-muted dark:placeholder-gray-400"
        />
        
        {/* Bagian Filter Kategori */}
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-2">Filter:</span>
            <button 
                onClick={() => setSelectedCategories([])}
                className={`px-3 py-1 text-sm font-medium border rounded-full transition-colors ${selectedCategories.length === 0 ? 'bg-balista-secondary text-white border-balista-secondary' : 'bg-white dark:bg-balista-muted text-balista-primary dark:text-white dark:border-balista-muted/50 hover:bg-balista-accent/50'}`}
            >
                Semua
            </button>
            
            {categories.length === 0 && <span className="text-xs text-gray-400 italic">(Tidak ada kategori)</span>}

            {categories.map(category => (
                <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`px-3 py-1 text-sm font-medium border rounded-full transition-colors ${selectedCategories.includes(category.id) ? 'bg-balista-secondary text-white border-balista-secondary' : 'bg-white dark:bg-balista-muted text-balista-primary dark:text-white dark:border-balista-muted/50 hover:bg-balista-accent/50'}`}
                >
                    {category.nama}
                </button>
            ))}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-balista-muted/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-300 text-lg">Belum ada resep yang ditambahkan.</p>
            <Link to="/admin/resep/tambah" className="text-balista-secondary hover:underline mt-2 inline-block">
                + Tambah Resep Pertama
            </Link>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <p className="text-center text-gray-500">Tidak ada resep yang cocok dengan pencarian Anda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe) => (
            <Link to={`/resep/${recipe.id}`} key={recipe.id} className="group block">
              <div className="bg-white dark:bg-balista-muted/80 rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl h-full flex flex-col">
                <div className="relative pb-[60%]">
                    <img
                    src={getGoogleDriveImageUrl(recipe.foto_url) || `https://placehold.co/600x400?text=${encodeURIComponent(recipe.nama)}`}
                    alt={recipe.nama}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                    }}
                    />
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="text-lg font-semibold text-balista-primary dark:text-white truncate" title={recipe.nama}>{recipe.nama}</h3>
                  <p className="text-sm text-balista-secondary dark:text-balista-accent mb-1">{recipe.kategori?.nama || 'Tanpa Kategori'}</p>
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