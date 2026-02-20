import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';
import { generateRecipeDetails } from '../services/geminiService';

// Fungsi khusus untuk merapikan teks mentah "Bahan|Jumlah|Satuan"
const parseData = (data: any) => {
  if (!data || data === "NULL") return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    return data.split(';').map(item => {
      const clean = item.trim();
      if (clean.includes('|')) {
        const parts = clean.split('|');
        return { nama: parts[0], jumlah: parts[1] || '', satuan: parts[2] || '' };
      }
      return clean;
    });
  }
  return [];
};

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('resep').select(`*, kategori(nama)`).eq('id', id).single();
        if (error) throw error;
        setRecipe(data);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleAIUpdate = async () => {
    if (!recipe || !id) return;
    setIsProcessing(true);
    const toastId = toast.loading("Chef AI sedang menyusun detail resep...");
    
    try {
      const aiResult = await generateRecipeDetails({ 
        namaMenu: recipe.nama, 
        bahan: recipe.bahan, 
        alat: recipe.alat,
        deskripsi: recipe.deskripsi 
      });

      if (!aiResult) throw new Error("AI tidak memberikan respon");

      // Update database dengan hasil dari AI
      const { error } = await supabase.from('resep').update({ 
        langkah: aiResult.steps, 
        deskripsi: aiResult.description,
        bahan: aiResult.bahan || recipe.bahan,
        alat: aiResult.alat || recipe.alat
      }).eq('id', id);

      if (error) throw error;
      
      setRecipe((prev: any) => ({ ...prev, ...aiResult, langkah: aiResult.steps, deskripsi: aiResult.description }));
      toast.success("Resep berhasil diperbarui oleh AI!", { id: toastId });
    } catch (e) {
      toast.error("Gagal memproses AI. Cek koneksi/API Key.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <Layout title="Loading..."><div className="p-20 text-center animate-pulse text-xl">Menyiapkan resep...</div></Layout>;
  if (!recipe) return <Layout title="Error"><div className="p-20 text-center">Menu tidak ditemukan.</div></Layout>;

  return (
    <Layout title={recipe.nama}>
      <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden mb-12 mt-6 border border-gray-100">
        {/* BAGIAN GAMBAR */}
        <div className="h-[450px] relative bg-gray-100">
          <img 
            src={getGoogleDriveImageUrl(recipe.foto_url)} 
            className="w-full h-full object-cover" 
            alt={recipe.nama} 
            onError={(e) => { e.currentTarget.src = "https://placehold.co/1200x600?text=Foto+Menu+Belista" }}
          />
          <Link to="/" className="absolute top-8 left-8 bg-white/90 backdrop-blur px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-white transition-all">
            ← Kembali ke Galeri
          </Link>
        </div>

        <div className="p-12">
          {/* HEADER & TOMBOL AI */}
          <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-10">
            <div className="flex-1">
              <h1 className="text-5xl font-black text-gray-800 mb-4 tracking-tight">{recipe.nama}</h1>
              <p className="text-2xl italic text-gray-400 font-medium">"{recipe.deskripsi || 'Resep spesial racikan Balista Sushi & Tea.'}"</p>
            </div>
            <button 
              onClick={handleAIUpdate} 
              disabled={isProcessing}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-[2rem] font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {isProcessing ? "⏳ Memproses..." : "✨ Detailkan AI"}
            </button>
          </div>

          {/* GRID BAHAN & ALAT */}
          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div className="bg-orange-50/50 p-10 rounded-[2.5rem] border border-orange-100">
              <h3 className="text-2xl font-black text-orange-800 mb-8 flex items-center gap-3">🥬 Bahan-Bahan</h3>
              <div className="space-y-4">
                {parseData(recipe.bahan).map((b: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border-b border-orange-200/50 pb-3">
                    <span className="text-lg font-bold text-gray-700">{typeof b === 'object' ? b.nama : b}</span>
                    <span className="text-orange-600 font-black px-4 py-1 bg-white rounded-full shadow-sm text-sm">
                      {typeof b === 'object' ? `${b.jumlah} ${b.satuan}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50/50 p-10 rounded-[2.5rem] border border-blue-100">
              <h3 className="text-2xl font-black text-blue-800 mb-8 flex items-center gap-3">🔪 Alat Masak</h3>
              <div className="flex flex-wrap gap-4">
                {parseData(recipe.alat).map((a: any, i: number) => (
                  <span key={i} className="bg-white px-6 py-3 rounded-2xl border border-blue-200 text-gray-700 font-bold shadow-sm">
                    {typeof a === 'object' ? a.nama : a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* LANGKAH MEMASAK */}
          <div className="bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100">
            <h3 className="text-3xl font-black text-gray-800 mb-10">Metode Pembuatan:</h3>
            {Array.isArray(recipe.langkah) && recipe.langkah.length > 0 ? (
              <div className="space-y-8">
                {recipe.langkah.map((step: string, idx: number) => (
                  <div key={idx} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-14 h-14 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div className="pt-2">
                      <p className="text-xl text-gray-700 leading-relaxed font-medium">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border-4 border-dashed border-gray-100">
                <p className="text-gray-400 text-xl font-bold italic mb-4">Instruksi memasak belum tersedia.</p>
                <p className="text-gray-400">Klik tombol di atas untuk menyusun resep otomatis dengan AI.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecipeDetail;