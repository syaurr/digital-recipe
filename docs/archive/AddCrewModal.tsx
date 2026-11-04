/// <reference types="react" />
import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';

interface AddCrewModalProps {
  onRefresh: () => void;
}

const AddCrewModal = ({ onRefresh }: AddCrewModalProps) => {
  const [formData, setFormData] = useState({
    nama: '',
    jabatan: '',
    foto_url: '',
    nomor_hp: '',
    status: 'Aktif'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('crews').insert([formData]);
    
    if (error) {
      toast.error("Gagal menambah data");
    } else {
      toast.success("Crew berhasil didaftarkan!");
      setFormData({ nama: '', jabatan: '', foto_url: '', nomor_hp: '', status: 'Aktif' });
      onRefresh();
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 mb-10">
      <h3 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-tight">➕ Tambah Crew Baru</h3>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input 
          type="text" placeholder="Nama Lengkap" 
          className="p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#cd5b19] font-medium"
          value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
          required
        />
        <input 
          type="text" placeholder="Jabatan" 
          className="p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#cd5b19] font-medium"
          value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})}
          required
        />
        <input 
          type="text" placeholder="Link Foto Drive" 
          className="p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#cd5b19] font-medium"
          value={formData.foto_url} onChange={e => setFormData({...formData, foto_url: e.target.value})}
        />
        <input 
          type="text" placeholder="WhatsApp" 
          className="p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#cd5b19] font-medium"
          value={formData.nomor_hp} onChange={e => setFormData({...formData, nomor_hp: e.target.value})}
        />
        <button type="submit" className="lg:col-span-4 bg-[#cd5b19] text-white p-4 rounded-2xl font-black uppercase hover:bg-[#b34d12] transition-all shadow-lg">
          Simpan Crew
        </button>
      </form>
    </div>
  );
};

export default AddCrewModal;