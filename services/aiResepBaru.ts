import { supabase } from './supabaseClient';

/**
 * Layanan untuk mengenerate detail SOP resep menggunakan AI.
 * Seluruh pemanggilan AI dialihkan ke Vercel Serverless Function (/api/generate-recipe)
 * agar API key (Groq / Gemini) tetap aman di sisi server dan tidak terekspos ke bundel client.
 */
export const generateRecipeDetails = async (payload: any) => {
  const namaMenu = payload?.namaMenu || payload?.nama || '';
  const bahan = payload?.bahan || '';
  const alat = payload?.alat || '';

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        namaMenu,
        bahan,
        alat,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Tangani error secara aman tanpa mencetak data sensitif
    console.error('Gagal mengambil SOP dari AI serverless endpoint:', error);
    return null;
  }
};
