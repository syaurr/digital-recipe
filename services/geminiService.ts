// 🟢 FILE: src/services/geminiService.ts
const API_KEY = "AIzaSyAb1i8fp-fZ9IYbR1-aljzHJz1cYfcpaRM"; 
const MODELS = ["gemini-1.5-flash", "gemini-pro"];

const cleanText = (t: string) => t ? t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "").trim() : "";
const cleanJSON = (t: string) => t.replace(/```json/g, '').replace(/```/g, '').trim();

// Fungsi ini PENTING: Mengubah object {nama, jumlah, satuan} jadi teks lengkap
// Contoh: "3 sdm Bubuk Taro"
const formatListToString = (list: any[]) => {
  if (!Array.isArray(list) || list.length === 0) return "Sesuai kebutuhan";
  return list.map(item => {
    if (typeof item === 'object') {
      return `${item.jumlah || ''} ${item.satuan || ''} ${item.nama}`.trim();
    }
    return String(item);
  }).join(', ');
};

const bikinResepDarurat = (nama: string, deskripsi: string, bahan: string, alat: string) => {
  const finalDesc = (deskripsi && deskripsi.length > 20 && !deskripsi.includes("Error")) 
    ? deskripsi 
    : `Nikmati kelezatan ${nama} khas Balista.`;

  return {
    desc: finalDesc,
    steps: [
      `Siapkan alat ${alat} di meja kerja yang bersih.`,
      `Siapkan bahan-bahan berikut: ${bahan}.`,
      `Racik dan olah bahan dengan hati-hati hingga matang/tercampur rata.`,
      `Sajikan ${nama} segera.`
    ]
  };
};

export const generateRecipeDetails = async (input: any) => {
  const { nama = "Menu", deskripsi = "", bahan = [], alat = [] } = input;
  
  // Ubah data array jadi string panjang biar bisa dibaca AI
  const strBahan = formatListToString(bahan);
  const strAlat = formatListToString(alat);
  const isCsvDesc = deskripsi && deskripsi.length > 20 && !deskripsi.includes("Error");

  if (!API_KEY) {
    const d = bikinResepDarurat(nama, deskripsi, strBahan, strAlat);
    return { description: d.desc, steps: d.steps, ingredients: bahan, tools: alat };
  }

  // 🔥 PROMPT KHUSUS: MEMAKSA DETAIL 🔥
  const prompt = `
    Kamu adalah Head Chef yang sangat teliti dalam menulis SOP (Standar Operasional Prosedur).
    Tugas: Tulis langkah pembuatan DETIL untuk menu "${nama}".

    DATA BAHAN (Gunakan ANGKA & SATUAN ini dalam kalimat langkah):
    ${strBahan}

    DATA ALAT (Sebutkan alat ini saat dipakai):
    ${strAlat}

    ATURAN PENULISAN LANGKAH (WAJIB DIPATUHI):
    1.  **DILARANG** menulis kalimat umum seperti "Siapkan bahan sesuai kebutuhan".
    2.  **WAJIB** menyebutkan **JUMLAH** dan **NAMA BAHAN** di dalam kalimat langkah.
        * ❌ Salah: "Masukkan gula dan teh."
        * ✅ Benar: "Tuang **30 ml Gula Cair** dan **150 ml Black Tea** ke dalam wadah."
    3.  **WAJIB** menyebutkan **ALAT** yang digunakan.
        * ❌ Salah: "Aduk rata."
        * ✅ Benar: "Kocok menggunakan **Shaker** hingga tercampur rata."
    4.  **URUTAN LOGIS:**
        * Jika Minuman (Tea/Milk): Seduh/Tuang Cairan -> Masukkan Bubuk/Gula -> Aduk/Shake -> Masukkan Es Batu -> Sajikan.
        * Jika Makanan: Siapkan Adonan -> Panaskan Alat (Teflon/Panci) -> Masak hingga matang -> Beri Topping.
    5.  **JANGAN HALUSINASI:** Jangan suruh pakai "Oven" kalau alatnya cuma "Kompor". Jangan suruh "Garnish Daun Mint" kalau bahannya tidak ada.

    FORMAT OUTPUT JSON:
    {
      "desc": "Deskripsi singkat 1 kalimat yang menggugah selera.",
      "step": [
        "1. [Persiapan] Siapkan (Sebutkan Alat) dan pastikan bersih...",
        "2. [Proses] Masukkan (Sebutkan Jumlah + Nama Bahan) ke dalam (Alat)...",
        "3. [Proses] Tambahkan (Sebutkan Jumlah + Nama Bahan lain)...",
        "4. [Teknik] Lakukan (Aduk/Shake/Masak) selama beberapa saat...",
        "5. [Penyajian] Tuang ke (Alat Saji) dan sajikan..."
      ]
    }
  `;

  for (const model of MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      if (!res.ok) continue;

      const data = await res.json();
      const text = cleanJSON(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
      const start = text.indexOf('{'), end = text.lastIndexOf('}');

      if (start !== -1 && end !== -1) {
        const result = JSON.parse(text.substring(start, end + 1));
        
        const finalDescription = isCsvDesc ? deskripsi : cleanText(result.desc || result.description);

        return {
          description: finalDescription,
          steps: (result.step || result.steps || []).map((s:any) => cleanText(String(s))),
          ingredients: bahan, 
          tools: alat         
        };
      }
    } catch (e) {
      console.warn("AI Error, coba model lain...", e);
    }
  }

  const fail = bikinResepDarurat(nama, deskripsi, strBahan, strAlat);
  return { description: fail.desc, steps: fail.steps, ingredients: bahan, tools: alat };
};

// Alias untuk Admin
export const generateRecipeSteps = generateRecipeDetails;