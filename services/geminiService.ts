// 🟢 FILE: src/services/geminiService.ts

const API_KEY = "AIzaSyCp_s9_EXYma0aGBXTbtKabOlEeW2wZL5I"; 

// DAFTAR MODEL YANG TERBUKTI AKTIF DI AKUN ANDA
// Kita hapus 'gemini-3-flash' karena menyebabkan error "Not Found"
const MODELS = [
  "gemini-2.5-flash",    // Gunakan ini sebagai yang utama karena lebih stabil
  "gemini-2.0-flash",    // Cadangan yang stabil
  "gemini-flash-latest" 
];

const cleanText = (t: string) => t ? t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "").trim() : "";
const cleanJSON = (t: string) => t.replace(/```json/g, '').replace(/```/g, '').trim();

const formatInput = (data: any) => {
  if (!data) return "Sesuai kebutuhan";
  if (Array.isArray(data)) return data.map(i => (typeof i==='object' ? `- ${i.jumlah||''} ${i.satuan||''} ${i.nama||''}` : `- ${String(i)}`)).join('\n');
  return String(data);
};

export const generateRecipeDetails = async (input: any) => {
  const { nama="", deskripsi="", bahan=[], alat=[], kategori="Umum" } = input;
  
  if (!API_KEY || API_KEY.includes("TEMPEL_KUNCI")) {
    throw new Error("API Key belum dimasukkan!");
  }

  const prompt = `Buat langkah resep "${nama}" (${kategori}). Bahan: ${formatInput(bahan)}. Alat: ${formatInput(alat)}. Output WAJIB JSON: {"langkah": ["Langkah 1...", "Langkah 2..."]}`;
  
  let pesanError = "";

  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });

      if (!res.ok) {
        const errData = await res.json();
        pesanError = errData.error?.message || "Error Google";
        
        // JIKA KUOTA HABIS, BERI PERINGATAN KHUSUS
        if (pesanError.toLowerCase().includes("quota")) {
          alert("⚠️ KUOTA PENUH: Google membatasi 5 permintaan per menit. Mohon tunggu 30 detik lalu coba lagi satu per satu.");
          throw new Error("Quota Exceeded");
        }
        continue; 
      }

      const data = await res.json();
      const text = cleanJSON(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
      const start = text.indexOf('{'), end = text.lastIndexOf('}');
      
      if (start !== -1 && end !== -1) {
        const result = JSON.parse(text.substring(start, end + 1));
        return { description: deskripsi, steps: (result.langkah||result.steps||[]).map((s:any)=>cleanText(String(s))) };
      }
    } catch (e: any) {
      pesanError = e.message;
      if (pesanError === "Quota Exceeded") throw e;
    }
  }

  alert(`❌ GAGAL.\nAlasan: ${pesanError}`);
  throw new Error(pesanError);
};

export const generateRecipeSteps = generateRecipeDetails;