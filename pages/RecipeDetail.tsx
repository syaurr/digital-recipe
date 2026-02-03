import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Resep } from '../types';
import Layout from '../components/Layout';
import { getSupabaseErrorMessage } from '../services/errorUtils';
import { getGoogleDriveImageUrl } from '../utils/imageUtils';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Resep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('resep')
        .select(`
          *,
          kategori (
            nama
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        const friendlyError = getSupabaseErrorMessage(error, 'Resep tidak ditemukan.');
        setError(friendlyError);
        console.error('Error fetching recipe detail:', error);
      } else {
        setRecipe(data as Resep);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return <Layout title="Detail Resep"><div className="text-center">Memuat detail resep...</div></Layout>;
  }

  if (error || !recipe) {
    return <Layout title="Error"><div className="text-center text-balista-danger p-4 bg-red-100 dark:bg-balista-danger-dark rounded-md">Error: {error || 'Resep tidak ditemukan.'}</div></Layout>;
  }

  return (
    <Layout title={recipe.nama}>
      <div className="bg-white dark:bg-balista-muted/80 shadow-xl rounded-lg overflow-hidden">
        <img
          src={getGoogleDriveImageUrl(recipe.foto_url) || `https://picsum.photos/800/400?random=${recipe.id}`}
          alt={recipe.nama}
          className="w-full h-64 object-cover"
        />
        <div className="p-6 md:p-8">
          <p className="text-sm text-balista-secondary dark:text-balista-accent font-semibold mb-2">{recipe.kategori?.nama}</p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{recipe.deskripsi}</p>

          {recipe.potongan && (
            <div className="mt-8 pt-4 border-t border-balista-accent/50">
                <p className="text-l font-bold">Penyajian: <span className="font-normal">{recipe.potongan}</span></p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
            <div>
              <h3 className="text-xl font-bold mb-4 border-b-2 border-balista-accent pb-2">Bahan-bahan</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                {recipe.bahan.map((item, index) => (
                  <li key={index}>{item.jumlah}{item.satuan} {item.nama}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 border-b-2 border-balista-accent pb-2">Alat</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                {recipe.alat.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-balista-accent pb-2">Langkah-langkah</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-200">
              {recipe.langkah.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

        </div>
      </div>
      <div className="mt-6 text-center">
          <Link to="/" className="text-balista-secondary hover:underline">
            &larr; Kembali ke Galeri
          </Link>
      </div>
    </Layout>
  );
};

export default RecipeDetail;