// services/geminiService.ts

// 🟢 MASUKKAN API KEY ANDA DI SINI
const API_KEY = "AIzaSyB8GBT3Gdn9T0GfYIzh4oAmgm2E1ySvTRI"; 

export const generateRecipeSteps = async (inputData: any) => {
  // 1. CEK API KEY
  if (!API_KEY || API_KEY.includes("PASTE_KODE")) {
      return { description: "", instructions: ["⛔ STOP: API Key bermasalah."] };
  }

  // 2. PERSIAPAN DATA
  let namaMenu = "Tanpa Nama";
  let bahan = [];
  let alat = [];
  
  if (typeof inputData === 'string') {
      namaMenu = inputData;
  } else if (typeof inputData === 'object') {
      namaMenu = inputData.namaMenu || inputData.nama || "Tanpa Nama";
      bahan = inputData.bahan || [];
      alat = inputData.alat || [];
  }

  if (!namaMenu || namaMenu === "Tanpa Nama") {
      return { description: "", instructions: ["⛔ ERROR: Nama menu kosong."] };
  }

  // Format Text Bahan & Alat
  let bahanStr = "";
  if (Array.isArray(bahan)) {
      bahanStr = bahan.map((b: any) => `${b.nama || ''} ${b.jumlah || ''} ${b.satuan || ''}`).join(", ");
  }
  let alatStr = Array.isArray(alat) ? alat.join(", ") : "";

  // Prompt (Instruksi untuk AI)
  const promptText = `
    Role: Chef Profesional.
    Tugas: Buatkan resep lengkap untuk "${namaMenu}".
    
    Data Tersedia:
    - Bahan: ${bahanStr || "Bebas/Sesuaikan sendiri"}
    - Alat: ${alatStr || "Alat dapur standar"}
    
    ATURAN OUTPUT (WAJIB JSON):
    Jangan berikan basa-basi. Keluarkan HANYA JSON valid dengan format ini:
    {
      "description": "Deskripsi singkat masakan (1-2 kalimat)",
      "ingredients": ["Bahan 1", "Bahan 2"],
      "instructions": ["Langkah 1", "Langkah 2"]
    }
    Gunakan Bahasa Indonesia.
  `;

  try {
    // ✅ KITA GUNAKAN MODEL TERBAIK DARI LIST ANDA
    const MODEL_NAME = "gemini-2.5-flash"; 
    
    // Gunakan v1beta agar kompatibel
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    
    console.log(`🤖 Menghubungi ${MODEL_NAME}...`);

    const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            // Kita matikan responseMimeType JSON agar aman, kita parsing manual saja
            generationConfig: { 
                temperature: 0.4,
                maxOutputTokens: 2048
            } 
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error("❌ Google API Error:", errData);
        throw new Error(`Gagal (${response.status}): ${errData.error?.message || 'Unknown Error'}`);
    }

    const result = await response.json();
    let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("AI tidak memberikan jawaban teks.");

    // --- PEMBERSIH JSON (Jaga-jaga AI ngasih Markdown) ---
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    // Parsing
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.warn("⚠️ JSON Rusak, melakukan fallback manual.");
        return { 
            description: `Resep ${namaMenu}`, 
            ingredients: [], 
            instructions: text.split('\n').filter((l:string) => l.length > 5) 
        };
    }

    return { 
        description: data.description || "", 
        ingredients: data.ingredients || [],
        instructions: data.instructions || [] 
    };

  } catch (error: any) {
    console.error("SERVICE CRASH:", error);
    return { 
        description: "", 
        instructions: [`⚠️ Terjadi Kesalahan: ${error.message}`] 
    };
  }
};