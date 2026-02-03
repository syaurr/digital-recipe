import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Kategori } from '../../types';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { getSupabaseErrorMessage } from '../../services/errorUtils';

const CategoryManager = () => {
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Kategori | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('kategori').select('*').order('nama', { ascending: true });
    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Gagal memuat kategori.'));
    } else {
      setCategories(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const { error } = await supabase.from('kategori').insert({ nama: newCategoryName.trim() });
    if (error) {
      toast.error(getSupabaseErrorMessage(error, `Gagal menambahkan kategori.`));
    } else {
      toast.success('Kategori berhasil ditambahkan.');
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCategory || !editingCategory.nama.trim()) return;

      const { error } = await supabase
        .from('kategori')
        .update({ nama: editingCategory.nama.trim() })
        .eq('id', editingCategory.id);

      if(error) {
        toast.error(getSupabaseErrorMessage(error, `Gagal memperbarui kategori.`));
      } else {
        toast.success('Kategori berhasil diperbarui.');
        setEditingCategory(null);
        fetchCategories();
      }
  }

  const handleDeleteCategory = async (category: Kategori) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${category.nama}"?`)) {
      const { error } = await supabase.from('kategori').delete().eq('id', category.id);
      if (error) {
        toast.error(getSupabaseErrorMessage(error, `Gagal menghapus kategori.`));
      } else {
        toast.success('Kategori berhasil dihapus.');
        fetchCategories();
      }
    }
  };

  return (
    <Layout title="Kelola Kategori">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-white dark:bg-balista-muted/80 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Tambah Kategori Baru</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori"
              className="flex-grow block w-full px-3 py-2 bg-white dark:bg-balista-primary border border-gray-300 dark:border-balista-muted rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-balista-secondary focus:border-balista-secondary"
            />
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-balista-secondary hover:bg-opacity-80">
              Tambah
            </button>
          </div>
        </form>

        <div className="bg-white dark:bg-balista-muted/80 shadow rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-balista-primary">
            {loading ? <li className="p-4 text-center">Memuat...</li> : 
            categories.map((cat) => (
              <li key={cat.id} className="p-4 flex items-center justify-between">
                {editingCategory?.id === cat.id ? (
                    <form onSubmit={handleUpdateCategory} className="flex-grow flex gap-2">
                        <input type="text" value={editingCategory.nama} onChange={(e) => setEditingCategory({...editingCategory, nama: e.target.value})} className="flex-grow block w-full px-3 py-1 bg-white dark:bg-balista-primary border border-gray-300 dark:border-balista-muted rounded-md" />
                        <button type="submit" className="text-sm text-green-600 hover:text-green-800">Simpan</button>
                        <button type="button" onClick={() => setEditingCategory(null)} className="text-sm text-gray-500 hover:text-gray-700">Batal</button>
                    </form>
                ) : (
                    <>
                    <span className="text-balista-primary dark:text-white">{cat.nama}</span>
                    <div className="space-x-2">
                        <button onClick={() => setEditingCategory(cat)} className="text-sm text-balista-secondary hover:underline">Edit</button>
                        <button onClick={() => handleDeleteCategory(cat)} className="text-sm text-balista-danger hover:underline">Hapus</button>
                    </div>
                    </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryManager;