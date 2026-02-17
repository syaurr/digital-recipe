import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { generateRecipeSteps } from '../../services/geminiService'; 
import type { Resep } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

// Fungsi jeda pembantu
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<Resep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const navigate = useNavigate();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('resep').select(`*, kategori(nama)`).order('created_at', { ascending: false });
    if (data) setRecipes(data as any[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0) return;
    
    // Konfirmasi dengan peringatan kuota
    if (!window.confirm(`Generate detail untuk ${selectedIds.size} menu?\n\nCatatan: Proses ini akan memakan waktu karena AI membutuhkan jeda 13 detik per menu agar tidak terkena limit kuota Google.`)) return;

    setIsBulkProcessing(true);
    const idsToProcess = Array.from(selectedIds);
    let successCount = 0;

    for (let i = 0; i < idsToProcess.length; i++) {
      const id = idsToProcess[i];
      try {
        const { data: recipe } = await supabase.from('resep').select('*').eq('id', id).single();
        
        if (recipe) {
          // Update status di layar
          setBulkProgress(`👨‍🍳 [${i + 1}/${idsToProcess.length}] Menyusun: ${recipe.nama}...`);
          
          const res = await generateRecipeSteps({ 
            nama: recipe.nama, 
            bahan: recipe.bahan, 
            alat: recipe.alat, 
            deskripsi: recipe.deskripsi 
          });
          
          await supabase.from('resep').update({ 
            langkah: res.steps, 
            deskripsi: recipe.deskripsi || res.description 
          }).eq('id', id);
          
          successCount++;

          // 🛑 JEDA KRUSIAL: 13 Detik (13000ms) agar tidak kena limit 5 req/menit
          if (i < idsToProcess.length - 1) {
            setBulkProgress(`⏳ Menunggu jeda kuota (13 detik)...`);
            await delay(13000); 
          }
        }
      } catch (e: any) { 
        console.error("Error pada menu:", id, e);
        toast.error(`Gagal memproses ${id}. Melanjutkan ke menu berikutnya...`);
        // Tetap beri jeda jika error karena kuota habis
        await delay(15000);
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    toast.success(`${successCount} Menu Berhasil Diperbarui!`);
    fetchRecipes();
  };

  return (
    <Layout title="Admin Dashboard">
      {isBulkProcessing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-center items-center text-white p-6 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mb-4"></div>
          <h2 className="text-xl font-bold">{bulkProgress}</h2>
          <p className="text-sm text-gray-400 mt-2">AI sedang bekerja. Jangan tutup halaman ini agar kuota tetap stabil.</p>
        </div>
      )}
      
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
         <div className="flex gap-3">
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkGenerate} 
                disabled={isBulkProcessing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg disabled:bg-gray-400"
              >
                ✨ Generate AI ({selectedIds.size})
              </button>
            )}
         </div>
         <Link to="/admin/resep/tambah" className="bg-balista-secondary text-white px-4 py-2 rounded-lg font-bold">+ Tambah</Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">
                <input 
                  type="checkbox" 
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(recipes.map(r => r.id)) : new Set())} 
                />
              </th>
              <th className="p-4 font-bold text-sm uppercase">Menu</th>
              <th className="p-4 font-bold text-sm uppercase">Status AI</th>
              <th className="p-4 text-right font-bold text-sm uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(r => {
              // Cek apakah langkah valid dan bukan pesan error
              const isComplete = Array.isArray(r.langkah) && 
                               r.langkah.length > 0 && 
                               !JSON.stringify(r.langkah).includes("quota") &&
                               !JSON.stringify(r.langkah).includes("403");

              return (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(r.id)} 
                      onChange={() => {
                        const next = new Set(selectedIds);
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                        setSelectedIds(next);
                      }} 
                    />
                  </td>
                  <td className="p-4 font-medium">{r.nama}</td>
                  <td className="p-4">
                    {isComplete ? 
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Lengkap ✅</span> : 
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Perlu AI ⚠️</span>
                    }
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => navigate(`/admin/resep/edit/${r.id}`)} className="text-blue-600 font-bold mr-4">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AdminDashboard;