import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Kategori } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { getSupabaseErrorMessage } from '../../services/errorUtils';
import { getGoogleDriveImageUrl } from '../../utils/imageUtils';

const EXCLUSION_LIST = ["Takoyaki & okonomiyaki", "dessert", "mentai rice", "minuman", "ramen", "salad"];

type BahanFormState = {
  nama: string;
  jumlah: string;
  satuan: string;
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
  const [potongan, setPotongan] = useState('');
  
  // STATE BARU: Langkah menjadi Array
  const [langkah, setLangkah] = useState<string[]>(['']);

  const [categories, setCategories] = useState<Kategori[]>([]);
  const [showPotongan, setShowPotongan] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setBahan(data.bahan?.map((b: { jumlah: any; }) => ({ ...b, jumlah: String(b.jumlah) })) || [{ nama: '', jumlah: '', satuan: '' }]);
      setAlat(data.alat?.join('\n') || '');
      setPotongan(data.potongan || '');
      // Masukkan langkah ke state, pastikan formatnya array
      setLangkah(data.langkah?.length ? data.langkah : ['']);
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

  // HANDLER LANGKAH
  const handleLangkahChange = (index: number, value: string) => {
    const newLangkah = [...langkah];
    newLangkah[index] = value;
    setLangkah(newLangkah);
  };
  const addLangkah = () => setLangkah([...langkah, '']);
  const removeLangkah = (index: number) => {
    const newLangkah = langkah.filter((_, i) => i !== index);
    setLangkah(newLangkah.length ? newLangkah : ['']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanFotoUrl = getGoogleDriveImageUrl(fotoUrl);

    const recipeData = {
      nama,
      deskripsi,
      foto_url: cleanFotoUrl,
      kategori_id: kategoriId,
      bahan: bahan.map(b => ({ nama: b.nama, satuan: b.satuan, jumlah: parseFloat(b.jumlah) || 0 })).filter(b => b.nama),
      alat: alat.split('\n').filter(a => a.trim() !== ''),
      langkah: langkah.map(l => l.trim()).filter(l => l !== ''),
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
          <label htmlFor="fotoUrl" className="block text-sm font-medium">URL Foto (Drive)</label>
          <input type="text" id="fotoUrl" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1 block w-full input-style"/>
          {fotoUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Preview Foto:</p>
              <img src={getGoogleDriveImageUrl(fotoUrl)} alt="Preview" className="w-full h-48 object-cover rounded-md border border-gray-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; alert("Gambar tidak muncul? Pastikan akses file di Google Drive sudah 'Siapa saja yang memiliki link'."); }}/>
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
                <button type="button" onClick={() => removeBahan(i)} className="text-balista-danger hover:text-balista-danger-dark font-bold text-xl">×</button>
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
        
        {/* UI LANGKAH YANG SUDAH DIROMBAK (DYNAMIC FIELDS) */}
        <div>
          <label className="block text-sm font-medium mb-3">Metode Pembuatan (SOP)</label>
          <div className="space-y-3">
            {langkah.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-md flex items-center justify-center font-bold text-gray-500 border border-gray-200">
                  {index + 1}
                </div>
                <textarea 
                  required 
                  className="w-full input-style resize-none" 
                  placeholder={`Langkah ${index + 1}...`} 
                  value={step} 
                  onChange={(e) => handleLangkahChange(index, e.target.value)} 
                  rows={2}
                />
                <button 
                  type="button" 
                  onClick={() => removeLangkah(index)} 
                  className="w-10 h-10 shrink-0 bg-red-50 text-red-500 rounded-md flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all border border-red-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLangkah} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-black transition-all">
            + Tambah Langkah
          </button>
        </div>
        
        <div className="text-right pt-6">
          <button type="button" onClick={() => navigate('/admin')} disabled={loading} className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
            {loading ? 'Menyimpan...' : 'Simpan Resep'}
          </button>
        </div>
        
        <style>{`
          .input-style { background-color: #fff; color: #111827; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); transition: all 0.2s ease-in-out; }
          .dark .input-style { background-color: #374151; color: #f3f4f6; border-color: #4b5563; }
          .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #cd5b19; box-shadow: 0 0 0 2px #cd5b19; }
        `}</style>
      </form>
    </Layout>
  );
};

export default RecipeForm;