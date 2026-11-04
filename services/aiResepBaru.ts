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
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
