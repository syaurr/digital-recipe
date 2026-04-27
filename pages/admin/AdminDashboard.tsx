import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // STATE BARU UNTUK KATEGORI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  // Perbaikan: Ganti 'kategori' menjadi 'kategori_id' agar sesuai dengan relasi database
  const [formData, setFormData] = useState({
    nama: '', kategori_id: '', foto_url: '', deskripsi: '', 
    bahan: [{ nama: '', jumlah: '', satuan: '' }], 
    alat: '', 
    langkah: [''], 
    potongan: ''
  });

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  // Ambil data resep DAN kategori sekaligus
  const fetchInitialData = async () => {
    const { data: recipeData } = await supabase.from('resep').select('*, kategori(nama)').order('created_at', { ascending: false });
    const { data: categoryData } = await supabase.from('kategori').select('*').order('nama', { ascending: true });
    
    setRecipes(recipeData || []);
    setCategories(categoryData || []);
  };

  const cleanFormat = (text: any) => {
    if (!text) return '';
    return String(text).replace(/[{}"]/g, '').split(';').map(t => t.trim().replace(/\|/g, ' ')).join('\n');
  };

  const parseExistingBahan = (bahanData: any) => {
    if (!bahanData) return [{ nama: '', jumlah: '', satuan: '' }];
    if (Array.isArray(bahanData)) {
      return bahanData.length > 0 ? bahanData.map(b => ({
        nama: b.nama || '',
        jumlah: String(b.jumlah || ''),
        satuan: b.satuan || ''
      })) : [{ nama: '', jumlah: '', satuan: '' }];
    }
    if (typeof bahanData === 'string') {
      const parsed = bahanData.split(/[;\n]/).map(item => {
        if (item.includes('|')) {
          const parts = item.split('|');
          const takaran = parts[1] ? parts[1].trim() : '';
          const match = takaran.match(/(\d+)\s*(.*)/);
          return { nama: parts[0].trim(), jumlah: match ? match[1] : takaran, satuan: match ? match[2].toLowerCase() : '' };
        }
        return { nama: item.trim(), jumlah: '', satuan: '' };
      }).filter(b => b.nama !== '');
      return parsed.length > 0 ? parsed : [{ nama: '', jumlah: '', satuan: '' }];
    }
    return [{ nama: '', jumlah: '', satuan: '' }];
  };

  const handleBahanChange = (index: number, field: string, value: string) => {
    const newBahan = [...formData.bahan];
    (newBahan[index] as any)[field] = value;
    setFormData({ ...formData, bahan: newBahan });
  };
  const addBahan = () => setFormData({ ...formData, bahan: [...formData.bahan, { nama: '', jumlah: '', satuan: '' }] });
  const removeBahan = (index: number) => {
    const newBahan = formData.bahan.filter((_, i) => i !== index);
    setFormData({ ...formData, bahan: newBahan.length ? newBahan : [{ nama: '', jumlah: '', satuan: '' }] });
  };

  const handleLangkahChange = (index: number, value: string) => {
    const newLangkah = [...formData.langkah];
    newLangkah[index] = value;
    setFormData({ ...formData, langkah: newLangkah });
  };
  const addLangkah = () => setFormData({ ...formData, langkah: [...formData.langkah, ''] });
  const removeLangkah = (index: number) => {
    const newLangkah = formData.langkah.filter((_, i) => i !== index);
    setFormData({ ...formData, langkah: newLangkah.length ? newLangkah : [''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Kategori
    if (!formData.kategori_id) {
      toast.error("Silakan pilih kategori menu terlebih dahulu!");
      return;
    }

    const tid = toast.loading("Menyimpan Menu...");
    
    try {
      const formatAlatStandard = (text: string) => {
        if (!text) return "";
        return text.split('\n').map(i => i.trim()).filter(i => i !== "").join(';');
      };

      const payload = {
        nama: formData.nama,
        foto_url: formData.foto_url,
        deskripsi: formData.deskripsi || 'SOP Standar Menu Balista',
        potongan: formData.potongan,
        kategori_id: formData.kategori_id, // Kategori dikirim ke DB
        bahan: formData.bahan
          .filter(b => b.nama.trim() !== '')
          .map(b => ({
            nama: b.nama.trim(),
            jumlah: parseFloat(b.jumlah) || null,
            satuan: b.satuan.trim()
          })),
        alat: formatAlatStandard(formData.alat),
        langkah: formData.langkah.map(l => l.trim()).filter(l => l !== "")
      };

      if (editingRecipe) {
        const { error } = await supabase.from('resep').update(payload).eq('id', editingRecipe.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('resep').insert([payload]);
        if (error) throw error;
      }

      toast.success("Berhasil! Menu tersimpan", { id: tid });
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      toast.error(`Gagal: ${err.message}`, { id: tid });
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    const tid = toast.loading("Menghapus menu...");
    try {
      const { error } = await supabase.from('resep').delete().eq('id', recipeToDelete.id);
      if (error) throw error;
      toast.success("Menu Berhasil Dihapus", { id: tid });
      setIsDeleteOpen(false);
      setRecipeToDelete(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`, { id: tid });
    }
  };

  useEffect(() => { 
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase() || "";
      if (userEmail !== 'tasya.officebalista@gmail.com') {
        toast.error("Akses Ditolak: Halaman khusus Admin Office");
        window.location.href = '/'; 
        return;
      }
    };
    checkAccess();
  }, []);

  return (
    <Layout title="Admin Dashboard">
      <div className="p-8 text-left bg-[#fdf8f0] min-h-screen relative">
        <div className="flex justify-between items-center mb-10 bg-white p-10 rounded-[45px] shadow-sm border border-gray-100">
          <div>
            <h2 className="font-black text-3xl uppercase tracking-tighter text-gray-800 italic">Manajemen SOP</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Digital Recipe System</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { 
              setEditingRecipe(null); 
              setFormData({nama:'', kategori_id:'', foto_url:'', deskripsi:'', bahan:[{nama:'', jumlah:'', satuan:''}], alat:'', langkah:[''], potongan:''}); 
              setIsModalOpen(true); 
            }} className="bg-[#d35400] text-white px-10 py-4 rounded-3xl font-black text-[11px] uppercase shadow-xl hover:scale-105 transition-all">
              + TAMBAH MENU
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[50px] shadow-sm overflow-hidden border border-gray-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-6 py-8 font-black uppercase tracking-tighter pl-12">Nama Menu</th>
                <th className="px-6 py-8 font-black uppercase tracking-tighter">Kategori</th>
                <th className="px-12 py-8 text-center font-black uppercase tracking-tighter">Status SOP</th>
                <th className="px-12 py-8 text-right font-black uppercase tracking-tighter">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 font-bold hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-6 uppercase tracking-tighter text-gray-700 text-[15px] pl-12">{r.nama}</td>
                  <td className="px-6 py-6 text-gray-500 uppercase tracking-widest text-[10px]">{r.kategori?.nama || '-'}</td>
                  <td className="px-12 py-6 text-center">
                    {(!r.langkah || r.langkah.length === 0) ? <span className="text-red-500 bg-red-50 px-5 py-2 rounded-full text-[9px] font-black uppercase italic tracking-widest">⚠️ Kosong</span> : <span className="text-green-600 bg-green-50 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">✅ Lengkap</span>}
                  </td>
                  <td className="px-12 py-6 text-right font-black">
                    <button onClick={() => { 
                      setEditingRecipe(r); 
                      const parsedLangkah = r.langkah && r.langkah.length > 0 ? r.langkah : [''];
                      setFormData({
                        nama: r.nama, 
                        kategori_id: r.kategori_id || '', // Load kategori yang sudah ada
                        foto_url: r.foto_url || '', 
                        deskripsi: r.deskripsi || '', 
                        bahan: parseExistingBahan(r.bahan), 
                        alat: cleanFormat(r.alat), 
                        langkah: parsedLangkah, 
                        potongan: r.potongan || ''
                      }); 
                      setIsModalOpen(true); 
                    }} className="text-indigo-600 uppercase text-[10px] hover:underline mr-6">Edit</button>
                    <button onClick={() => { setRecipeToDelete(r); setIsDeleteOpen(true); }} className="text-red-500 uppercase text-[10px] hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[45px] p-12 max-w-md w-full shadow-2xl text-center border border-gray-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-gray-800 mb-2">Hapus Menu?</h3>
              <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed">Apakah Anda yakin ingin menghapus menu <span className="text-red-500">"{recipeToDelete?.nama}"</span>? Data tidak dapat dikembalikan.</p>
              <div className="flex gap-4">
                <button onClick={handleDeleteRecipe} className="flex-1 bg-red-500 text-white py-4 rounded-[25px] font-black uppercase text-[11px] shadow-lg hover:bg-red-600 transition-all">Ya, Hapus</button>
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-[25px] font-black uppercase text-[11px]">Batal</button>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
            <div className="bg-white rounded-[55px] w-full max-w-4xl max-h-[95vh] overflow-y-auto p-12 shadow-2xl border border-gray-100">
              <h3 className="font-black text-2xl uppercase mb-8 tracking-tighter text-gray-800 italic">{editingRecipe ? 'Edit SOP Menu' : 'Tambah Menu Baru'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                
                {/* BARIS PERTAMA: Nama, Kategori, Potongan */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Nama Menu</label>
                    <input required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Kategori</label>
                    <select required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm cursor-pointer text-gray-700" value={formData.kategori_id} onChange={e => setFormData({...formData, kategori_id: e.target.value})}>
                      <option value="">Pilih Kategori...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Potongan / Porsi</label>
                    <input className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" placeholder="Contoh: 8 potong" value={formData.potongan} onChange={e => setFormData({...formData, potongan: e.target.value})} />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Deskripsi Singkat Menu</label>
                  <textarea className="w-full p-5 bg-gray-50 rounded-[25px] h-20 outline-none font-bold text-xs resize-none" placeholder="Contoh: Menu lezat khas Balista..." value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
                </div>

                <div className="col-span-2 bg-orange-50/30 p-8 rounded-[35px] border border-orange-100">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-4 block tracking-widest italic leading-none">
                    Bahan-Bahan
                  </label>
                  
                  <div className="space-y-3">
                    {formData.bahan.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-[20px] shadow-sm">
                        <input 
                          required
                          type="text" 
                          placeholder="Nama Bahan (Cth: Nori)" 
                          className="flex-grow p-4 bg-gray-50 rounded-[15px] outline-none font-bold text-xs focus:ring-2 focus:ring-orange-200 transition-all"
                          value={item.nama}
                          onChange={(e) => handleBahanChange(index, 'nama', e.target.value)}
                        />
                        <input 
                          type="number" 
                          placeholder="Jml" 
                          className="w-24 p-4 bg-gray-50 rounded-[15px] outline-none font-bold text-xs text-center focus:ring-2 focus:ring-orange-200 transition-all"
                          value={item.jumlah}
                          onChange={(e) => handleBahanChange(index, 'jumlah', e.target.value)}
                        />
                        <select 
                          className="w-32 p-4 bg-gray-50 rounded-[15px] outline-none font-bold text-xs cursor-pointer focus:ring-2 focus:ring-orange-200 transition-all text-gray-600"
                          value={item.satuan}
                          onChange={(e) => handleBahanChange(index, 'satuan', e.target.value)}
                        >
                          <option value="">Satuan</option>
                          <option value="gr">Gram (gr)</option>
                          <option value="ml">Mili (ml)</option>
                          <option value="pcs">Pcs</option>
                          <option value="lembar">Lembar</option>
                          <option value="buah">Buah</option>
                          <option value="sdt">Sdt</option>
                          <option value="sdm">Sdm</option>
                          <option value="secukupnya">Secukupnya</option>
                        </select>
                        <button 
                          type="button" 
                          onClick={() => removeBahan(index)}
                          className="w-12 h-12 shrink-0 bg-red-50 text-red-500 rounded-[15px] flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={addBahan}
                    className="mt-4 bg-[#d35400] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b34700] transition-all shadow-md"
                  >
                    + Tambah Bahan
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Link Foto Menu (Drive)</label>
                  <input required className="w-full p-5 bg-gray-50 rounded-[25px] outline-none font-bold text-sm" value={formData.foto_url} onChange={e => setFormData({...formData, foto_url: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-2 block tracking-widest italic leading-none">Alat Masak (Pisahkan dgn Baris)</label>
                  <textarea className="w-full p-5 bg-gray-50 rounded-[25px] min-h-[120px] outline-none font-bold text-xs" value={formData.alat} onChange={e => setFormData({...formData, alat: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4 mb-4 block tracking-widest italic leading-none">
                    Metode Pembuatan (SOP)
                  </label>
                  
                  <div className="space-y-3">
                    {formData.langkah.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-[15px] flex items-center justify-center font-black text-gray-400">
                          {index + 1}
                        </div>
                        <textarea 
                          required 
                          className="w-full p-4 bg-gray-50 rounded-[20px] outline-none font-bold text-xs resize-none" 
                          placeholder={`Langkah operasional ke-${index + 1}...`} 
                          value={step} 
                          onChange={(e) => handleLangkahChange(index, e.target.value)} 
                          rows={2}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeLangkah(index)} 
                          className="w-10 h-10 shrink-0 bg-red-50 text-red-500 rounded-[15px] flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={addLangkah} 
                    className="mt-4 bg-gray-800 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    + Tambah Langkah
                  </button>
                </div>

                <div className="col-span-2 flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[30px] font-black uppercase text-[12px] shadow-xl hover:bg-indigo-700 transition-all">SIMPAN MENU</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[30px] font-black uppercase text-[12px]">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;