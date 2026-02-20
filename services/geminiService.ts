// 🟢 FILE: src/services/geminiService.ts

// 👇 GANTI DENGAN API KEY BARU ANDA (Penting!)
const API_KEY = "AIzaSyC7KxMJUFVZOuLShqDMc7v7YK0_8cImGhQ"; 

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

const cleanJSON = (t: string) => t.replace(/```json/g, '').replace(/```/g, '').trim();

export const generateRecipeDetails = async (input: any) => {
  const nama = input.nama || input.namaMenu || "Menu";
  const bahan = input.bahan || "";
  const alat = input.alat || "";

  const prompt = `Buat deskripsi yang menggugah selera dan langkah memasak untuk menu: ${nama}. 
  Bahan: ${bahan}. Alat: ${alat}. 
  Output harus JSON murni: {"deskripsi": "...", "langkah": ["langkah 1", "langkah 2"]}`;
  
  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: "POST", 
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = cleanJSON(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
      const start = text.indexOf('{'), end = text.lastIndexOf('}');
      
      if (start !== -1 && end !== -1) {
        const result = JSON.parse(text.substring(start, end + 1));
        return { 
          description: result.deskripsi || result.description || "", 
          steps: result.langkah || [] 
        };
      }
    } catch (e) { 
      console.error("AI Error:", e); 
    }
  }
  throw new Error("Gagal menghubungi AI");
};

// 🛑 Export cadangan agar AdminDashboard tidak error merah!
export const generateRecipeSteps = generateRecipeDetails;