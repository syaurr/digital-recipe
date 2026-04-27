import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<any>(null);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  // STATE BARU UNTUK LOADING UI
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortBy, setSortBy] = useState('terbaru');
  const [filterCategory, setFilterCategory] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');

  const [formData, setFormData] = useState({
    nama: '', kategori_id: '', foto_url: '', deskripsi: '', 
    bahan: [{ nama: '', jumlah: '', satuan: '' }], 
    alat: '', langkah: [''], potongan: '', status_sop: 'Lengkap', alasan_belum_lengkap: ''
  });

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    const { data: recipeData } = await supabase.from('resep').select('*, kategori(nama)').order('created_at', { ascending: false });
    const { data: categoryData } = await supabase.from('kategori').select('*').order('nama', { ascending: true });
    
    setRecipes(recipeData || []);
    setCategories(categoryData || []);
  };

  const processedRecipes = useMemo(() => {
    let result = [...recipes];
    if (filterCategory !== 'semua') result = result.filter(r => r.kategori_id === filterCategory);
    if (filterStatus !== 'semua') result = result.filter(r => r.status_sop === filterStatus);

    result.sort((a, b) => {
      if (sortBy === 'terbaru') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'terlama') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'az') return a.nama.localeCompare(b.nama);
      if (sortBy === 'za') return b.nama.localeCompare(a.nama);
      return 0;
    });
    return result;
  }, [recipes, filterCategory, filterStatus, sortBy]);

  const dashboardStats = useMemo(() => {
    const total = recipes.length;
    const lengkap = recipes.filter(r => r.status_sop !== 'Belum').length;
    const belum = recipes.filter(r => r.status_sop === 'Belum').length;
    const pLengkap = total === 0 ? 0 : Math.round((lengkap / total) * 100);

    const catCount: Record<string, number> = {};
    recipes.forEach(r => {
      const catName = r.kategori?.nama || 'Uncategorized';
      catCount[catName] = (catCount[catName] || 0) + 1;
    });
    
    const topCategories = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { total, lengkap, belum, pLengkap, topCategories };
  }, [recipes]);

  const parseExistingBahan = (bahanData: any) => {
    if (!bahanData) return [{ nama: '', jumlah: '', satuan: '' }];
    if (typeof bahanData === 'string' && bahanData.trim().startsWith('[')) {
      try {
        const parsedJSON = JSON.parse(bahanData);
        if (Array.isArray(parsedJSON)) {
          return parsedJSON.map(b => ({ nama: b.nama || '', jumlah: String(b.jumlah || ''), satuan: (b.satuan || '').toLowerCase() }));
        }
      } catch (e) { console.error("Gagal parse JSON bahan", e); }
    }
    if (Array.isArray(bahanData)) {
      return bahanData.length > 0 ? bahanData.map(b => ({ nama: b.nama || '', jumlah: String(b.jumlah || ''), satuan: (b.satuan || '').toLowerCase() })) : [{ nama: '', jumlah: '', satuan: '' }];
    }
    if (typeof bahanData === 'string') {
      const parsed = bahanData.split(/[;\n]/).map(item => {
        if (item.includes('|')) {
          const parts = item.split('|').map(p => p.trim());
          if (parts.length >= 3) return { nama: parts[0], jumlah: parts[1], satuan: parts[2].toLowerCase() };
          const takaran = parts[1] || '';
          const match = takaran.match(/(\d+(?:\.\d+)?)\s*(.*)/);
          return { nama: parts[0], jumlah: match ? match[1] : takaran, satuan: match ? match[2].toLowerCase() : '' };
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
    if (!formData.kategori_id) return toast.error("Pilih kategori menu!");
    if (formData.status_sop === 'Belum' && !formData.alasan_belum_lengkap.trim()) return toast.error("Isi alasan kenapa SOP belum lengkap!");

    setIsSaving(true); // NYALAKAN LOADING STATE
    const tid = toast.loading("Memproses data ke server...");
    
    try {
      const payload = {
        nama: formData.nama, 
        foto_url: formData.foto_url, 
        deskripsi: formData.deskripsi || 'SOP Standar Menu Balista',
        potongan: formData.potongan, 
        kategori_id: formData.kategori_id, 
        bahan: formData.bahan.filter(b => b.nama.trim() !== '').map(b => `${b.nama.trim()}|${b.jumlah.trim()}|${b.satuan.trim()}`).join(';'),
        alat: formData.alat.split('\n').map(a => a.trim()).filter(a => a !== ""),
        langkah: formData.langkah.map(l => l.trim()).filter(l => l !== ""),
        status_sop: formData.status_sop, 
        alasan_belum_lengkap: formData.status_sop === 'Belum' ? formData.alasan_belum_lengkap : null
      };

      if (editingRecipe) {
        const { error } = await supabase.from('resep').update(payload).eq('id', editingRecipe.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('resep').insert([payload]);
        if (error) throw error;
      }

      toast.success(editingRecipe ? "Perubahan berhasil disimpan! ✅" : "Menu baru berhasil ditambahkan! ✅", { id: tid });
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) { 
      toast.error(`Gagal menyimpan: ${err.message}`, { id: tid }); 
    } finally {
      setIsSaving(false); // MATIKAN LOADING STATE
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    
    setIsDeleting(true); // NYALAKAN LOADING HAPUS
    const tid = toast.loading("Menghapus menu permanen...");
    
    try {
      const { error } = await supabase.from('resep').delete().eq('id', recipeToDelete.id);
      if (error) throw error;
      toast.success("Menu Berhasil Dihapus 🗑️", { id: tid });
      setIsDeleteOpen(false);
      setRecipeToDelete(null);
      fetchInitialData();
    } catch (err: any) { 
      toast.error(`Gagal menghapus: ${err.message}`, { id: tid }); 
    } finally {
      setIsDeleting(false); // MATIKAN LOADING HAPUS
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="p-4 md:p-8 text-left bg-[#fdf8f0] min-h-screen relative">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 bg-white p-6 md:p-10 rounded-[25px] md:rounded-[35px] shadow-sm border border-gray-100 text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <h2 className="font-black text-2xl md:text-4xl uppercase tracking-tighter text-gray-800 italic">Manajemen SOP</h2>
            <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Input Head Chef</p>
          </div>
          <button onClick={() => { 
            setEditingRecipe(null); 
            setFormData({nama:'', kategori_id:'', foto_url:'', deskripsi:'', bahan:[{nama:'', jumlah:'', satuan:''}], alat:'', langkah:[''], potongan:'', status_sop: 'Lengkap', alasan_belum_lengkap: ''}); 
            setIsModalOpen(true); 
          }} className="w-full md:w-auto bg-[#d35400] text-white px-8 py-4 rounded-2xl font-black text-xs md:text-sm uppercase shadow-xl hover:bg-[#b34700] hover:-translate-y-1 transition-all">
            + TAMBAH MENU
          </button>
        </div>

        {/* MINI DASHBOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
          
          <div className="bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] shadow-sm border border-gray-100 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-50 rounded-full opacity-50"></div>
            <p className="text-[10px] md:text-sm font-black uppercase text-gray-400 tracking-widest mb-2 z-10">Total Menu Balista</p>
            <h3 className="text-5xl md:text-6xl font-black text-[#d35400] tracking-tighter z-10">{dashboardStats.total}</h3>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-2 z-10">Resep tercatat di sistem</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] shadow-sm border border-gray-100">
            <p className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Sebaran Kategori</p>
            <div className="space-y-4">
              {dashboardStats.topCategories.length > 0 ? dashboardStats.topCategories.map(([name, count], idx) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-600 mb-1">
                    <span className="truncate w-3/4">{name}</span>
                    <span>{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-green-500' : 'bg-purple-500'}`} 
                      style={{ width: `${(count / dashboardStats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 font-bold">Belum ada data kategori.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[25px] md:rounded-[35px] shadow-sm border border-gray-100 flex flex-col justify-between sm:col-span-2 md:col-span-1">
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest">Progress SOP</p>
                <span className="text-lg md:text-xl font-black text-green-500">{dashboardStats.pLengkap}%</span>
              </div>
              <div className="w-full bg-red-100 rounded-full h-4 mb-6 flex overflow-hidden shadow-inner">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${dashboardStats.pLengkap}%` }}></div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <div className="bg-green-50 p-3 rounded-2xl w-1/2 border border-green-100 text-center">
                <p className="text-xl md:text-2xl font-black text-green-600">{dashboardStats.lengkap}</p>
                <p className="text-[9px] md:text-[10px] font-black text-green-400 uppercase tracking-widest mt-1">Lengkap</p>
              </div>
              <div className="bg-red-50 p-3 rounded-2xl w-1/2 border border-red-100 text-center">
                <p className="text-xl md:text-2xl font-black text-red-500">{dashboardStats.belum}</p>
                <p className="text-[9px] md:text-[10px] font-black text-red-400 uppercase tracking-widest mt-1">Belum</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER & SORTING BAR */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">
          <div className="flex-1 bg-white p-3 md:p-2 rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center border border-gray-200 shadow-sm px-4">
            <span className="text-xs md:text-sm font-bold text-gray-400 mb-1 md:mb-0 md:mr-3 shrink-0">Kategori:</span>
            <select className="w-full bg-transparent outline-none font-bold text-xs md:text-sm text-gray-700 cursor-pointer" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="semua">Semua Kategori</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nama}</option>)}
            </select>
          </div>

          <div className="flex-1 bg-white p-3 md:p-2 rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center border border-gray-200 shadow-sm px-4">
            <span className="text-xs md:text-sm font-bold text-gray-400 mb-1 md:mb-0 md:mr-3 shrink-0">Status SOP:</span>
            <select className="w-full bg-transparent outline-none font-bold text-xs md:text-sm text-gray-700 cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="semua">Semua Status</option>
              <option value="Lengkap">✅ Sudah Lengkap</option>
              <option value="Belum">⚠️ Belum Lengkap</option>
            </select>
          </div>

          <div className="flex-1 bg-white p-3 md:p-2 rounded-xl md:rounded-2xl flex flex-col md:flex-row md:items-center border border-gray-200 shadow-sm px-4">
            <span className="text-xs md:text-sm font-bold text-gray-400 mb-1 md:mb-0 md:mr-3 shrink-0">Urutkan:</span>
            <select className="w-full bg-transparent outline-none font-bold text-xs md:text-sm text-gray-700 cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="terbaru">Paling Baru</option>
              <option value="terlama">Paling Lama</option>
              <option value="az">A - Z</option>
              <option value="za">Z - A</option>
            </select>
          </div>
        </div>

        {/* TABEL DATA MENU */}
        <div className="bg-white rounded-[25px] md:rounded-[40px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-gray-50 text-[10px] md:text-xs font-black uppercase text-gray-400 border-b border-gray-200">
                <tr>
                  <th className="px-4 md:px-8 py-4 md:py-6 w-12 md:w-16 text-center">No</th>
                  <th className="px-4 md:px-6 py-4 md:py-6 font-black uppercase tracking-tighter">Nama Menu</th>
                  <th className="px-4 md:px-6 py-4 md:py-6 font-black uppercase tracking-tighter">Kategori</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-center font-black uppercase tracking-tighter">Status SOP</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-right font-black uppercase tracking-tighter">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedRecipes.length > 0 ? processedRecipes.map((r, index) => (
                  <tr key={r.id} className="font-bold hover:bg-orange-50/30 transition-all">
                    <td className="px-4 md:px-8 py-4 md:py-6 text-center text-gray-400 font-black">{index + 1}</td>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <p className="uppercase tracking-tighter text-gray-800 text-sm md:text-base whitespace-nowrap md:whitespace-normal">{r.nama}</p>
                      <p className="text-gray-400 italic text-[10px] md:text-xs truncate max-w-[150px] md:max-w-[250px] font-medium mt-1">{r.deskripsi}</p>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6 text-orange-600 uppercase tracking-widest text-[10px] md:text-xs">{r.kategori?.nama || '-'}</td>
                    <td className="px-4 md:px-10 py-4 md:py-6 text-center">
                      {r.status_sop === 'Belum' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-red-600 bg-red-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">⚠️ Belum Lengkap</span>
                          {r.alasan_belum_lengkap && (
                            <span className="text-[9px] md:text-[10px] text-red-400 font-bold max-w-[100px] md:max-w-[150px] truncate" title={r.alasan_belum_lengkap}>"{r.alasan_belum_lengkap}"</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-700 bg-green-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">✅ Lengkap</span>
                      )}
                    </td>
                    <td className="px-4 md:px-10 py-4 md:py-6 text-right whitespace-nowrap">
                      <button onClick={() => { 
                        setEditingRecipe(r); 
                        setFormData({
                          nama: r.nama, kategori_id: r.kategori_id || '', foto_url: r.foto_url || '', deskripsi: r.deskripsi || '', 
                          bahan: parseExistingBahan(r.bahan), alat: Array.isArray(r.alat) ? r.alat.join('\n') : String(r.alat || '').replace(/[{}"]/g, '').split(/[;,]/).join('\n'), 
                          langkah: Array.isArray(r.langkah) && r.langkah.length > 0 ? r.langkah : [''], potongan: r.potongan || '',
                          status_sop: r.status_sop || 'Lengkap', alasan_belum_lengkap: r.alasan_belum_lengkap || ''
                        }); 
                        setIsModalOpen(true); 
                      }} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs uppercase font-black hover:bg-indigo-600 hover:text-white transition-all mr-2 shadow-sm border border-indigo-100">
                        Edit
                      </button>
                      <button onClick={() => { setRecipeToDelete(r); setIsDeleteOpen(true); }} className="bg-red-50 text-red-500 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs uppercase font-black hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100">
                        Hapus
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 md:py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm">
                      Menu tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL HAPUS */}
        {isDeleteOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-[25px] md:rounded-[35px] p-6 md:p-10 max-w-sm w-full shadow-2xl text-center border border-gray-100">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-3xl md:text-4xl font-black">!</div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-gray-800 mb-2">Hapus Menu?</h3>
              <p className="text-gray-500 font-bold text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">Yakin hapus <span className="text-red-500">"{recipeToDelete?.nama}"</span>? Data hilang permanen.</p>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <button 
                  onClick={handleDeleteRecipe} 
                  disabled={isDeleting}
                  className="w-full bg-red-500 text-white py-3 md:py-4 rounded-xl md:rounded-[20px] font-black uppercase text-xs shadow-lg hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
                <button 
                  onClick={() => setIsDeleteOpen(false)} 
                  disabled={isDeleting}
                  className="w-full bg-gray-100 text-gray-500 py-3 md:py-4 rounded-xl md:rounded-[20px] font-black uppercase text-xs hover:bg-gray-200 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-6 text-left">
            <div className="bg-white rounded-[25px] md:rounded-[45px] w-full max-w-5xl max-h-[95vh] overflow-y-auto p-5 md:p-12 shadow-2xl border border-gray-100">
              <h3 className="font-black text-2xl md:text-3xl uppercase mb-6 md:mb-8 tracking-tighter text-gray-800 italic">{editingRecipe ? 'Edit SOP Menu' : 'Tambah Menu Baru'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                
                {/* Status SOP */}
                <div className="col-span-1 md:col-span-2 bg-[#fdf8f0] p-5 md:p-8 rounded-[20px] md:rounded-[30px] border border-orange-100 shadow-inner">
                  <label className="text-[10px] md:text-xs font-black uppercase text-[#d35400] mb-3 md:mb-4 block tracking-widest italic">Verifikasi Head Chef: Status SOP</label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-3 md:mb-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="status_sop" value="Lengkap" checked={formData.status_sop === 'Lengkap'} onChange={(e) => setFormData({...formData, status_sop: e.target.value})} className="w-5 h-5 md:w-6 md:h-6 accent-green-600" />
                      <span className="font-bold text-sm md:text-base text-gray-700 group-hover:text-green-600">SOP Lengkap ✅</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="status_sop" value="Belum" checked={formData.status_sop === 'Belum'} onChange={(e) => setFormData({...formData, status_sop: e.target.value})} className="w-5 h-5 md:w-6 md:h-6 accent-red-500" />
                      <span className="font-bold text-sm md:text-base text-gray-700 group-hover:text-red-500">Belum Lengkap ⚠️</span>
                    </label>
                  </div>
                  {formData.status_sop === 'Belum' && (
                    <div className="mt-3 md:mt-4">
                      <textarea className="w-full p-3 md:p-4 bg-white rounded-[15px] md:rounded-[20px] outline-none font-bold text-xs md:text-sm border border-red-200 focus:ring-2 focus:ring-red-400 resize-none text-red-700" placeholder="Alasan (Cth: Takaran belum fix...)" value={formData.alasan_belum_lengkap} onChange={e => setFormData({...formData, alasan_belum_lengkap: e.target.value})} rows={2} />
                    </div>
                  )}
                </div>

                {/* Input Dasar */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Nama Menu</label>
                    <input required className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] outline-none font-bold text-sm md:text-base text-gray-800 focus:bg-white focus:ring-2 focus:ring-orange-200" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Kategori</label>
                    <select required className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] outline-none font-bold text-sm md:text-base text-gray-800 cursor-pointer focus:bg-white focus:ring-2 focus:ring-orange-200" value={formData.kategori_id} onChange={e => setFormData({...formData, kategori_id: e.target.value})}>
                      <option value="">Pilih Kategori...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nama}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Potongan / Porsi</label>
                    <input className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] outline-none font-bold text-sm md:text-base text-gray-800 focus:bg-white focus:ring-2 focus:ring-orange-200" placeholder="Cth: 8 potong" value={formData.potongan} onChange={e => setFormData({...formData, potongan: e.target.value})} />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Deskripsi Singkat Menu</label>
                  <textarea className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] outline-none font-bold text-xs md:text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-orange-200 resize-none" rows={2} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
                </div>

                {/* Bahan-bahan */}
                <div className="col-span-1 md:col-span-2 bg-orange-50/40 p-4 md:p-8 rounded-[20px] md:rounded-[30px] border border-orange-100">
                  <label className="text-[10px] md:text-xs font-black uppercase text-gray-500 ml-1 md:ml-2 mb-3 md:mb-4 block tracking-widest italic">Bahan-Bahan</label>
                  <div className="space-y-3 md:space-y-4">
                    {formData.bahan.map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 bg-white p-3 md:p-3 rounded-[15px] md:rounded-[20px] shadow-sm border border-orange-50 md:border-none">
                        <input required type="text" placeholder="Nama Bahan" className="w-full md:flex-grow p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-[15px] outline-none font-bold text-xs md:text-sm focus:ring-2 focus:ring-orange-200" value={item.nama} onChange={(e) => handleBahanChange(index, 'nama', e.target.value)} />
                        
                        <div className="flex w-full md:w-auto gap-2 md:gap-3">
                          <input type="number" placeholder="Jml" className="w-1/2 md:w-24 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-[15px] outline-none font-bold text-xs md:text-sm text-center focus:ring-2 focus:ring-orange-200" value={item.jumlah} onChange={(e) => handleBahanChange(index, 'jumlah', e.target.value)} />
                          <select className="w-1/2 md:w-36 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-[15px] outline-none font-bold text-xs md:text-sm cursor-pointer focus:ring-2 focus:ring-orange-200 text-gray-700" value={item.satuan} onChange={(e) => handleBahanChange(index, 'satuan', e.target.value)}>
                            <option value="satuan">kosong</option>
                            <option value="kepal">Kepal</option>
                            <option value="stick">Stick</option>
                            <option value="gr">Gram</option>
                            <option value="ml">Mililiter (ml)</option>
                            <option value="pcs">Pcs</option>
                            <option value="lembar">Lembar</option>
                            <option value="buah">Buah</option>
                            <option value="sdt">Sdt</option>
                            <option value="sdm">Sdm</option>
                            <option value="secukupnya">Secukupnya</option>
                          </select>
                        </div>
                        
                        <button type="button" onClick={() => removeBahan(index)} className="w-full md:w-12 h-10 md:h-12 shrink-0 bg-red-50 text-red-500 rounded-xl md:rounded-[15px] flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all text-xs md:text-base">
                          <span className="md:hidden">Hapus</span>
                          <span className="hidden md:inline">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addBahan} className="mt-4 md:mt-5 w-full md:w-auto bg-[#d35400] text-white px-6 py-3 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-[#b34700] transition-all shadow-md">+ Tambah Bahan</button>
                </div>

                {/* Alat & Foto */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Link Foto (Drive)</label>
                    <input required className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] outline-none font-bold text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-orange-200" value={formData.foto_url} onChange={e => setFormData({...formData, foto_url: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-1 md:mb-2 block tracking-widest italic">Alat Masak (Pisahkan Baris)</label>
                    <textarea className="w-full p-3 md:p-4 bg-gray-50 rounded-[15px] md:rounded-[20px] min-h-[100px] md:min-h-[120px] outline-none font-bold text-xs md:text-sm focus:bg-white focus:ring-2 focus:ring-orange-200" value={formData.alat} onChange={e => setFormData({...formData, alat: e.target.value})} />
                  </div>
                </div>

                {/* Langkah-langkah */}
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] md:text-xs font-black uppercase text-gray-400 ml-1 md:ml-2 mb-3 md:mb-4 block tracking-widest italic">Metode Pembuatan (SOP)</label>
                  <div className="space-y-3 md:space-y-4">
                    {formData.langkah.map((step, index) => (
                      <div key={index} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 bg-white md:bg-transparent p-3 md:p-0 rounded-[15px] border border-gray-100 md:border-none shadow-sm md:shadow-none">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                           <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-gray-100 rounded-xl md:rounded-[15px] flex items-center justify-center font-black text-sm md:text-lg text-gray-500 md:text-gray-400">{index + 1}</div>
                           <span className="md:hidden font-bold text-xs text-gray-400 uppercase tracking-widest">Langkah Operasional</span>
                        </div>
                        
                        <textarea required className="w-full p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-[20px] outline-none font-bold text-xs md:text-sm resize-none focus:bg-white focus:ring-2 focus:ring-orange-200" placeholder={`Instruksi detail...`} value={step} onChange={(e) => handleLangkahChange(index, e.target.value)} rows={2} />
                        
                        <button type="button" onClick={() => removeLangkah(index)} className="w-full md:w-12 h-10 md:h-12 shrink-0 bg-red-50 text-red-500 rounded-xl md:rounded-[15px] flex items-center justify-center font-black hover:bg-red-500 hover:text-white transition-all text-xs md:text-base">
                           <span className="md:hidden">Hapus Langkah</span>
                           <span className="hidden md:inline">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addLangkah} className="mt-4 md:mt-5 w-full md:w-auto bg-gray-800 text-white px-6 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-black transition-all">+ Tambah Langkah</button>
                </div>

                {/* Submit Buttons */}
                <div className="col-span-1 md:col-span-2 flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4 md:pt-8 mt-2 md:mt-0 border-t md:border-none border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="w-full md:flex-1 bg-gray-100 text-gray-500 py-4 md:py-5 rounded-xl md:rounded-[25px] font-black uppercase text-xs md:text-sm hover:bg-gray-200 transition-all disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={isSaving} className="w-full md:flex-1 bg-indigo-600 text-white py-4 md:py-5 rounded-xl md:rounded-[25px] font-black uppercase text-xs md:text-sm shadow-xl hover:bg-indigo-700 transition-all disabled:bg-indigo-400">
                    {isSaving ? 'MENYIMPAN... ⏳' : 'SIMPAN MENU'}
                  </button>
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