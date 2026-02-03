import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { generateRecipeSteps } from '../../services/geminiService';
import type { Resep, Kategori, Bahan } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { getSupabaseErrorMessage } from '../../services/errorUtils';

const EXCLUSION_LIST = ["Takoyaki & okonomiyaki", "dessert", "mentai rice", "minuman", "ramen", "salad"];

type BahanFormState = {
  nama: string;
  jumlah: string;
  satuan: string;
};

// --- GANTI FUNGSI INI DI BAGIAN ATAS FILE ---

const getDirectLink = (url: string) => {
  if (!url) return "";
  
  // Deteksi ID dari link Google Drive
  const idMatch = url.match(/\/d\/(.+?)\//);
  
  if (idMatch && idMatch[1]) {
    // KITA PAKAI LINK KHUSUS 'lh3' (Lebih Cepat & Anti-Blokir)
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  
  return url; 
};

const RecipeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [bahan, setBahan] = useState<BahanFormState[]>([{ nama: '', jumlah: '', satuan: '' }]);
  const [alat, setAlat] = useState('');
  const [langkah, setLangkah] = useState('');
  const [potongan, setPotongan] = useState('');

  const [categories, setCategories] = useState<Kategori[]>([]);
  const [showPotongan, setShowPotongan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('kategori').select('*');
      if (error) toast.error(getSupabaseErrorMessage(error, 'Gagal memuat kategori.'));
      else setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const fetchRecipe = useCallback(async (recipeId: string) => {
    const { data, error } = await supabase.from('resep').select('*, kategori(*)').eq('id', recipeId).single();
    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Gagal memuat data resep.'));
      navigate('/admin');
    } else if (data) {
      setNama(data.nama);
      setDeskripsi(data.deskripsi || '');
      setFotoUrl(data.foto_url || '');
      setKategoriId(data.kategori_id);
      setBahan(data.bahan?.map(b => ({ ...b, jumlah: String(b.jumlah) })) || [{ nama: '', jumlah: '', satuan: '' }]);
      setAlat(data.alat?.join('\n') || '');
      setLangkah(data.langkah?.join('\n') || '');
      setPotongan(data.potongan || '');
    }
    setInitialLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (isEditing && id) {
      fetchRecipe(id);
    }
  }, [isEditing, id, fetchRecipe]);
  
  useEffect(() => {
    const selectedCategory = categories.find(c => c.id === kategoriId);
    if (selectedCategory && !EXCLUSION_LIST.includes(selectedCategory.nama)) {
      setShowPotongan(true);
    } else {
      setShowPotongan(false);
      setPotongan('');
    }
  }, [kategoriId, categories]);

  const handleBahanChange = (index: number, field: keyof BahanFormState, value: string) => {
    const newBahan = [...bahan];
    newBahan[index][field] = value;
    setBahan(newBahan);
  };

  const addBahan = () => setBahan([...bahan, { nama: '', jumlah: '', satuan: '' }]);
  const removeBahan = (index: number) => setBahan(bahan.filter((_, i) => i !== index));
// --- PERBAIKAN UTAMA: Kirim Data sebagai Object ---
  const handleGenerateSteps = async () => {
      if (!nama) {
          toast.error("Harap isi Nama Menu terlebih dahulu.");
          return;
      }

      setAiLoading(true);
      try {
          // PERBAIKAN DISINI:
          // Jangan kirim (nama) saja, tapi kirim object { namaMenu: nama, ... }
          // Kita juga kirim bahan & alat agar AI lebih pintar
          const payload = {
            namaMenu: nama,
            bahan: bahan,
            alat: alat
          };

          const data = await generateRecipeSteps(payload);
          const aiData: any = data;

          // Cek jika balikan dari service adalah error (instruksi cuma 1 baris dan ada kata Error/Gagal)
          if (aiData.instructions && aiData.instructions.length === 1 && (aiData.instructions[0].includes("⛔") || aiData.instructions[0].includes("⚠️"))) {
             throw new Error(aiData.instructions[0]);
          }

          // 2. Update Bahan-bahan dari hasil AI
          if (aiData.ingredients && Array.isArray(aiData.ingredients)) {
             const formattedIngredients = aiData.ingredients.map((item: string) => ({
                 nama: item,
                 jumlah: '',
                 satuan: ''
             }));
             // Gabungkan bahan yang sudah ada (jika mau) atau timpa
             // Disini kita timpa jika bahan user masih kosong/default
             if (bahan.length <= 1 && !bahan[0].nama) {
                setBahan(formattedIngredients);
             }
          }

          // 3. Update Langkah-langkah
          if (aiData.instructions && Array.isArray(aiData.instructions)) {
             setLangkah(aiData.instructions.join('\n'));
          }

          // 4. Update Deskripsi (jika ada)
          if (aiData.description) {
              setDeskripsi(aiData.description);
          }

          toast.success("Resep berhasil dibuat oleh AI!");

      } catch (error: any) {
          console.error("Error AI:", error);
          toast.error(error.message || "Gagal menghasilkan resep.");
      }
      setAiLoading(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- PERBAIKAN: Bersihkan URL Foto Google Drive ---
    const cleanFotoUrl = getDirectLink(fotoUrl);

    const recipeData = {
      nama,
      deskripsi,
      foto_url: cleanFotoUrl, // Pakai URL yang sudah dibersihkan
      kategori_id: kategoriId,
      bahan: bahan
        .map(b => ({
          nama: b.nama,
          satuan: b.satuan,
          jumlah: parseFloat(b.jumlah) || 0,
        }))
        .filter(b => b.nama), // Filter berdasarkan nama saja agar hasil AI tidak hilang jika satuan kosong
      alat: alat.split('\n').filter(a => a.trim() !== ''),
      langkah: langkah.split('\n').filter(l => l.trim() !== ''),
      potongan: showPotongan ? potongan : null,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('resep').update(recipeData).eq('id', id));
    } else {
      ({ error } = await supabase.from('resep').insert(recipeData));
    }

    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Gagal menyimpan resep.'));
    } else {
      toast.success(`Resep berhasil ${isEditing ? 'diperbarui' : 'disimpan'}!`);
      navigate('/admin');
    }
    setLoading(false);
  };

  if (initialLoading) {
    return <Layout title="Memuat Resep..."><div className="text-center">Loading...</div></Layout>
  }

  return (
    <Layout title={isEditing ? 'Edit Resep' : 'Tambah Resep Baru'}>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-live="assertive" role="alertdialog">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4 text-center">
            <svg className="animate-spin h-12 w-12 text-balista-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Menyimpan Resep...</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              Proses ini mungkin memakan waktu lebih lama jika datanya besar. Mohon jangan tutup halaman ini.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-white dark:bg-balista-muted/80 p-8 rounded-lg shadow-md">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nama" className="block text-sm font-medium">Nama Menu</label>
            <input type="text" id="nama" value={nama} onChange={e => setNama(e.target.value)} required className="mt-1 block w-full input-style"/>
          </div>
          <div>
            <label htmlFor="kategori" className="block text-sm font-medium">Kategori</label>
            <select id="kategori" value={kategoriId} onChange={e => setKategoriId(e.target.value)} required className="mt-1 block w-full input-style">
              <option value="">Pilih Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="deskripsi" className="block text-sm font-medium">Deskripsi Singkat</label>
          <textarea id="deskripsi" value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={2} className="mt-1 block w-full input-style"></textarea>
        </div>
        <div>
          <label htmlFor="fotoUrl" className="block text-sm font-medium">URL Foto (termasuk Google Drive)</label>
          <input 
            type="text" 
            id="fotoUrl" 
            value={fotoUrl} 
            onChange={e => setFotoUrl(e.target.value)} 
            placeholder="https://drive.google.com/..." 
            className="mt-1 block w-full input-style"
          />
          {/* FITUR BARU: PREVIEW GAMBAR LANGSUNG */}
          {fotoUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Preview Foto:</p>
              <img 
                src={getDirectLink(fotoUrl)} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-md border border-gray-300"
                onError={(e) => {
                  // Kalau gambar error, kasih pesan bantuan
                  (e.target as HTMLImageElement).style.display = 'none';
                  alert("Gambar tidak muncul? Pastikan akses file di Google Drive sudah 'Siapa saja yang memiliki link' (Anyone with the link).");
                }}
              />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Bahan-bahan</h3>
          <div className="space-y-2">
            {bahan.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" placeholder="Nama Bahan" value={b.nama} onChange={e => handleBahanChange(i, 'nama', e.target.value)} className="w-1/2 input-style"/>
                <input type="number" placeholder="Jumlah" value={b.jumlah} onChange={e => handleBahanChange(i, 'jumlah', e.target.value)} className="w-1/4 input-style"/>
                <input type="text" placeholder="Satuan" value={b.satuan} onChange={e => handleBahanChange(i, 'satuan', e.target.value)} className="w-1/4 input-style"/>
                <button type="button" onClick={() => removeBahan(i)} className="text-balista-danger hover:text-balista-danger-dark font-bold text-xl">&times;</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addBahan} className="mt-2 text-sm text-balista-secondary hover:underline">+ Tambah Bahan</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="alat" className="block text-sm font-medium">Alat (satu per baris)</label>
            <textarea id="alat" value={alat} onChange={e => setAlat(e.target.value)} rows={4} className="mt-1 block w-full input-style"></textarea>
          </div>
          {showPotongan && (
            <div>
              <label htmlFor="potongan" className="block text-sm font-medium">Potongan/Saran Penyajian</label>
              <input type="text" id="potongan" value={potongan} onChange={e => setPotongan(e.target.value)} className="mt-1 block w-full input-style" placeholder="Cth: 8 potong"/>
            </div>
          )}
        </div>
        
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="langkah" className="block text-sm font-medium">Langkah-langkah (satu per baris)</label>
                <button type="button" onClick={handleGenerateSteps} disabled={aiLoading || loading} className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:opacity-70">
                    {aiLoading ? 'Memproses...' : 'Generate (AI)'}
                </button>
            </div>
            <textarea id="langkah" value={langkah} onChange={e => setLangkah(e.target.value)} rows={8} className="block w-full input-style"></textarea>
        </div>
        
        <div className="text-right">
          <button type="button" onClick={() => navigate('/admin')} disabled={loading || aiLoading} className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-balista-primary hover:bg-gray-50 dark:hover:bg-opacity-80 disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={loading || aiLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
            {loading ? 'Menyimpan...' : 'Simpan Resep'}
          </button>
        </div>
        
        <style>{`
          .input-style {
            background-color: #fff;
            color: #111827;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            padding: 0.5rem 0.75rem;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            transition: all 0.2s ease-in-out;
          }
          .dark .input-style {
            background-color: #374151;
            color: #f3f4f6;
            border-color: #4b5563;
          }
          .input-style:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #cd5b19;
            box-shadow: 0 0 0 2px #cd5b19;
          }
        `}</style>
      </form>
    </Layout>
  );
};

export default RecipeForm;