import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { generateRecipeSteps } from '../../services/geminiService'; // Import Service AI
import type { Resep } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { getSupabaseErrorMessage } from '../../services/errorUtils';
import ImportCSVModal from '../../components/ImportCSVModal';

// Fungsi delay agar tidak kena limit Google
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<Resep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  
  // STATE BARU: Untuk Checkbox & Proses Massal
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const navigate = useNavigate();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    // Kita perlu select '*' atau field lengkap jika ingin memproses, 
    // tapi untuk tabel cukup field dasar. Nanti saat proses bulk baru kita fetch detail.
    const { data, error } = await supabase
      .from('resep')
      .select(`
        id,
        nama,
        created_at,
        langkah, 
        deskripsi,
        kategori (nama)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Gagal memuat resep.'));
    } else {
      setRecipes(data as any[] as Resep[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // --- LOGIC CHECKBOX ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(recipes.map(r => r.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // --- LOGIC BULK GENERATE AI ---
  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(`Yakin ingin generate ulang Langkah & Deskripsi untuk ${selectedIds.size} resep terpilih? Data lama akan ditimpa oleh AI.`)) {
        return;
    }

    setIsBulkProcessing(true);
    const idsToProcess = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < idsToProcess.length; i++) {
        const id = idsToProcess[i];
        
        try {
            // 1. Ambil data lengkap resep ini dari DB (butuh bahan & alat)
            const { data: fullRecipe, error: fetchError } = await supabase
                .from('resep')
                .select('*')
                .eq('id', id)
                .single();
            
            if (fetchError || !fullRecipe) throw new Error("Gagal ambil detail");

            // Update status di layar
            setBulkProgress(`Memproses (${i + 1}/${idsToProcess.length}): ${fullRecipe.nama}...`);

            // 2. Panggil AI
            const aiPayload = {
                namaMenu: fullRecipe.nama,
                bahan: fullRecipe.bahan, // JSONB
                alat: fullRecipe.alat,   // Array
                potongan: fullRecipe.potongan
            };

            const aiResult: any = await generateRecipeSteps(aiPayload);

            // 3. Update Database
            // Kita hanya update langkah & deskripsi. Nama/Foto/Kategori jangan diubah.
            const updateData: any = {};
            
            if (aiResult.instructions && aiResult.instructions.length > 0) {
                updateData.langkah = aiResult.instructions;
            }
            if (aiResult.description) {
                updateData.deskripsi = aiResult.description;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('resep')
                    .update(updateData)
                    .eq('id', id);
                
                if (updateError) throw updateError;
                successCount++;
            } else {
                console.warn(`Skipping ${fullRecipe.nama}, AI tidak memberi hasil.`);
            }

            // 4. Jeda Waktu (Penting agar tidak diblokir Google)
            await delay(3000); // 3 detik per resep

        } catch (err) {
            console.error(`Gagal memproses ID ${id}`, err);
            failCount++;
        }
    }

    setIsBulkProcessing(false);
    setBulkProgress("");
    setSelectedIds(new Set()); // Reset pilihan
    toast.success(`Selesai! Sukses: ${successCount}, Gagal: ${failCount}`);
    fetchRecipes(); // Refresh tabel
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus resep "${name}"?`)) {
      const { error } = await supabase.from('resep').delete().eq('id', id);
      if (error) {
        toast.error(getSupabaseErrorMessage(error, 'Gagal menghapus resep.'));
      } else {
        toast.success(`Resep "${name}" berhasil dihapus.`);
        fetchRecipes();
      }
    }
  };
  
  const handleImportSuccess = () => {
    toast.success("Impor berhasil! Daftar resep sedang diperbarui.");
    fetchRecipes();
  };

  return (
    <Layout title="Admin Dashboard: Kelola Resep">
      {/* --- OVERLAY LOADING SAAT BULK PROCESS --- */}
      {isBulkProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col justify-center items-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-balista-secondary mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">Sedang Bekerja... 🤖</h2>
              <p className="text-lg animate-pulse">{bulkProgress}</p>
              <p className="text-sm text-gray-400 mt-4">Jangan tutup halaman ini.</p>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        {/* AREA TOMBOL MASSAL (Muncul jika ada yang dicentang) */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
            {selectedIds.size > 0 ? (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-200 dark:border-blue-800 animate-fadeIn">
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-200 px-2">
                        {selectedIds.size} Dipilih
                    </span>
                    <button
                        onClick={handleBulkGenerate}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-1.5 px-3 rounded shadow-md transition-all flex items-center gap-1"
                    >
                        ✨ Generate AI Otomatis
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2"
                    >
                        Batal
                    </button>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic hidden md:block">
                    Tips: Centang kotak di kiri untuk aksi massal.
                </p>
            )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="bg-balista-muted hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
          >
            Import CSV
          </button>
          <Link
            to="/admin/resep/tambah"
            className="bg-balista-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
          >
            + Tambah Resep
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-balista-muted/80 shadow-md rounded-lg overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-balista-accent/30 dark:bg-balista-muted">
            <tr>
              {/* KOLOM CHECKBOX HEADER */}
              <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={recipes.length > 0 && selectedIds.size === recipes.length}
                    className="w-4 h-4 rounded border-gray-300 text-balista-secondary focus:ring-balista-secondary cursor-pointer"
                  />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-balista-primary dark:text-gray-200 uppercase tracking-wider">Nama Resep</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-balista-primary dark:text-gray-200 uppercase tracking-wider">Status Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-balista-primary dark:text-gray-200 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-balista-primary dark:text-gray-200 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-balista-primary">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Memuat...</td></tr>
            ) : recipes.map((recipe) => {
              // Cek kelengkapan data untuk indikator visual
              const hasSteps = recipe.langkah && recipe.langkah.length > 0;
              const hasDesc = recipe.deskripsi && recipe.deskripsi.length > 5;
              const isComplete = hasSteps && hasDesc;

              return (
                <tr key={recipe.id} className={`hover:bg-balista-accent/20 dark:hover:bg-balista-muted/50 ${selectedIds.has(recipe.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  {/* KOLOM CHECKBOX ROW */}
                  <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(recipe.id)}
                        onChange={() => handleSelectOne(recipe.id)}
                        className="w-4 h-4 rounded border-gray-300 text-balista-secondary focus:ring-balista-secondary cursor-pointer"
                      />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-balista-primary dark:text-white">
                      {recipe.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {isComplete ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                             Lengkap ✅
                          </span>
                      ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                             Belum Generate ⚠️
                          </span>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{recipe.kategori?.nama || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => navigate(`/admin/resep/edit/${recipe.id}`)} className="text-balista-secondary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(recipe.id, recipe.nama)} className="text-balista-danger hover:underline">Hapus</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </Layout>
  );
};

export default AdminDashboard;