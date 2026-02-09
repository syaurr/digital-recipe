// 🟢 FILE: src/pages/RecipeDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import Layout from '../components/Layout';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';
import { generateRecipeDetails } from '../services/geminiService';

// Fungsi Parsing Data (Penting agar data tidak error)
const parse = (d: any) => {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (typeof d === 'string') {
    if (d.includes(';')) {
      return d.split(';').map(i => {
        const c = i.trim();
        // Cek format Pipa: Nama|Jumlah|Satuan
        if (c.includes('|')) {
          const p = c.split('|');
          return { nama: p[0], jumlah: p[1], satuan: p[2] };
        }
        return c;
      });
    }
    if (d.includes(',')) return d.split(',');
    return [d];
  }
  return [];
};

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<any>(null);
  const [loading, setL] = useState(true);
  const [gen, setG] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase.from('resep').select(`*, kategori(nama)`).eq('id', id).single();
      setR(data);
      setL(false);
    };
    fetch();
  }, [id]);

  const handleAI = async () => {
    if (!r) return;
    setG(true);
    const toastId = toast.loading("Chef AI sedang bekerja...");
    try {
      const res = await generateRecipeDetails({ nama: r.nama, deskripsi: r.deskripsi, bahan: r.bahan, alat: r.alat });
      
      setR((prev: any) => ({ ...prev, deskripsi: res.description, langkah: res.steps }));
      await supabase.from('resep').update({ deskripsi: res.description, langkah: res.steps, status_data: 'Lengkap' }).eq('id', id);
      
      toast.success("Resep Berhasil Dibuat!", { id: toastId });
    } catch (e) { toast.error("Gagal memproses", { id: toastId }); }
    setG(false);
  };

  if (loading || !r) return <Layout title="Memuat..."><div className="p-20 text-center">Sedang mengambil data resep...</div></Layout>;

  // Data Siap Tampil
  const bahan = parse(r.bahan);
  const alat = parse(r.alat);
  const langkah = parse(r.langkah);

  return (
    <Layout title={r.nama}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto border border-gray-100">
        
        {/* === 1. GAMBAR HEADER === */}
        <div className="h-64 md:h-96 w-full bg-gray-200 relative">
           <img 
             src={getGoogleDriveImageUrl(r.foto_url)} 
             className="w-full h-full object-cover" 
             alt={r.nama}
           />
           <div className="absolute top-4 left-4">
             <Link to="/" className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full font-bold hover:bg-white transition-all shadow-sm">
                ← Kembali
             </Link>
           </div>
        </div>

        <div className="p-8 md:p-12">
           
           {/* === 2. JUDUL & DESKRIPSI === */}
           <div className="mb-8 border-b border-gray-100 pb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <span className="text-green-600 font-bold uppercase tracking-wider text-sm mb-1 block">
                    {r.kategori?.nama || "Kategori Umum"}
                  </span>
                  <h1 className="text-4xl font-extrabold text-gray-900">{r.nama}</h1>
                </div>
                
                {/* TOMBOL AI (KEMBALI SEPERTI AWAL: TOMBOL UNGU JELAS) */}
                <button 
                  onClick={handleAI} 
                  disabled={gen} 
                  className={`px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                    gen ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 hover:-translate-y-0.5"
                  }`}
                >
                   {gen ? "⏳ Memproses..." : "✨ Buat Resep AI"}
                </button>
              </div>

              <p className="text-gray-600 text-lg italic leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                "{r.deskripsi || "Deskripsi belum tersedia."}"
              </p>
           </div>

           {/* === 3. INFO PORSI (KOTAK KUNING) === */}
           {r.porsi && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-10 flex items-center gap-3 text-yellow-800 font-medium shadow-sm">
                <span className="text-xl">🍛</span> 
                <span>Penyajian: <b>{r.porsi}</b></span>
             </div>
           )}

           {/* === 4. GRID: BAHAN (Kiri) & ALAT (Kanan) === */}
           <div className="grid md:grid-cols-2 gap-12 mb-12">
             
             {/* KOLOM KIRI: BAHAN */}
             <div>
               <h3 className="font-bold text-2xl text-gray-800 border-b-2 border-green-500 pb-2 mb-6 flex items-center gap-2">
                 🥦 Bahan-bahan
               </h3>
               {bahan.length > 0 ? (
                 <ul className="space-y-3">
                   {bahan.map((b: any, i: number) => (
                     <li key={i} className="flex items-start gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                       <span className="mt-1.5 w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                       {typeof b === 'object' ? (
                          <span><b>{b.jumlah} {b.satuan}</b> {b.nama}</span>
                       ) : (
                          <span>{b}</span>
                       )}
                     </li>
                   ))}
                 </ul>
               ) : <p className="text-gray-400 italic">Data bahan kosong.</p>}
             </div>

             {/* KOLOM KANAN: ALAT */}
             <div>
               <h3 className="font-bold text-2xl text-gray-800 border-b-2 border-blue-500 pb-2 mb-6 flex items-center gap-2">
                 🛠️ Alat Masak
               </h3>
               {alat.length > 0 ? (
                 <ul className="space-y-3">
                   {alat.map((a: any, i: number) => (
                     <li key={i} className="flex items-start gap-3 text-gray-700 bg-blue-50 p-3 rounded-lg">
                       <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                       <span>{typeof a === 'object' ? a.nama : a}</span>
                     </li>
                   ))}
                 </ul>
               ) : <p className="text-gray-400 italic">Data alat belum diisi.</p>}
             </div>

           </div>

           {/* === 5. LANGKAH PEMBUATAN (FULL BAWAH) === */}
           <div>
             <h3 className="font-bold text-2xl text-gray-800 border-b-2 border-gray-300 pb-2 mb-6 flex items-center gap-2">
               📝 Langkah-langkah
             </h3>
             {langkah.length > 0 ? (
               <div className="space-y-4">
                 {langkah.map((l: any, i: number) => (
                   <div key={i} className="flex gap-4 group">
                     <div className="flex-shrink-0 w-8 h-8 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors">
                       {i + 1}
                     </div>
                     <p className="text-gray-700 text-lg leading-relaxed pt-0.5 border-b border-gray-100 pb-4 w-full">
                       {typeof l === 'object' ? JSON.stringify(l) : l}
                     </p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                 <p className="text-gray-500 mb-2">Langkah belum tersedia.</p>
                 <p className="text-sm text-purple-600 font-bold">Klik tombol "Buat Resep AI" di atas.</p>
               </div>
             )}
           </div>

        </div>
      </div>
      
      {/* Spacer Bawah */}
      <div className="h-20"></div>
    </Layout>
  );
};

export default RecipeDetail;