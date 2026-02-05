import { GoogleGenerativeAI } from "@google/generative-ai";

// 🟢 KUNCI API ANDA (Biarkan yang ini, karena sudah terbukti VALID)
const API_KEY = "AIzaSyCJJcgLO33crJS2DNU_3VL7wJglfP1iNIo"; 

export const generateRecipeSteps = async (inputData: any) => {
  // 1. Validasi Kunci
  if (!API_KEY || API_KEY.length < 10) {
      return { description: "", instructions: ["⛔ ERROR: API Key belum diisi."] };
  }

  // 2. Inisialisasi Google SDK
  const genAI = new GoogleGenerativeAI(API_KEY);

  // 3. Persiapan Data
  let namaMenu = typeof inputData === 'string' ? inputData : (inputData.nama || inputData.namaMenu || "Menu");
  let bahan = Array.isArray(inputData.bahan) ? inputData.bahan.map((b:any) => b.nama).join(", ") : "";
  let alat = Array.isArray(inputData.alat) ? inputData.alat.join(", ") : "";

  const promptText = `
    Kamu adalah Chef Profesional.
    Tugas: Buatkan resep lengkap untuk "${namaMenu}".
    Bahan tersedia: ${bahan}. Alat: ${alat}.
    
    OUTPUT WAJIB JSON VALID (Tanpa Markdown):
    {
      "description": "Deskripsi singkat masakan (1-2 kalimat)",
      "ingredients": ["Bahan 1", "Bahan 2"],
      "instructions": ["Langkah 1", "Langkah 2"]
    }
    Bahasa Indonesia.
  `;

  // --- LOGIKA BARU: GUNAKAN MODEL YANG ADA DI LIST JSON ANDA ---
  // Kita pakai "gemini-flash-latest" karena itu pasti punya kuota gratis.
  const modelsToTry = [
      "gemini-flash-latest",    // Target Utama (Biasanya versi 1.5 gratis)
      "gemini-pro-latest",      // Cadangan 1
      "gemini-2.0-flash-lite-preview-09-2025" // Cadangan 2 (Versi Lite biasanya boleh)
  ];
  
  for (const modelName of modelsToTry) {
    try {
        console.log(`🤖 Mencoba model: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        let text = response.text();
        
        if (!text) continue; 

        // Bersihkan JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1) text = text.substring(first, last + 1);

        const data = JSON.parse(text);

        return { 
            description: data.description || `Resep ${namaMenu}`, 
            ingredients: data.ingredients || [],
            instructions: data.instructions || [] 
        };

    } catch (error: any) {
        console.warn(`❌ Gagal pakai ${modelName}:`, error.message);
        // Jika errornya kuota (429), kita lanjut ke model berikutnya
    }
  }

  // Jika semua model gagal
  return { 
      description: "", 
      instructions: ["⚠️ Gagal Quota: Tunggu 1 menit lalu coba lagi."] 
  };
};