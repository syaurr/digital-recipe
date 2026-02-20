// File: src/services/aiResepBaru.ts

const API_KEY = "AIzaSyAb1i8fp-fZ9IYbR1-aljzHJz1cYfcpaRM"; 

// --- DAFTAR MODEL ---
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

// --- RESEP DARURAT (BACKUP) ---
const bikinResepDarurat = (namaMenu: string, deskripsiLama: string, listBahan: any[]) => {
  const menu = namaMenu.toLowerCase();
  
  // Deteksi Minuman
  const isMinuman = menu.includes('ice') || menu.includes('es ') || menu.includes('tea') || 
                    menu.includes('teh') || menu.includes('kopi') || menu.includes('coffee') || 
                    menu.includes('latte') || menu.includes('jus') || menu.includes('boba') ||
                    menu.includes('squash') || menu.includes('drink');

  const teksBahan = listBahan.map(b => 
    typeof b === 'object' ? `${b.jumlah || ''} ${b.satuan || ''} ${b.nama}` : b
  ).join(', ');

  // JIKA DESKRIPSI LAMA ITU ERROR, KITA GANTI BARU
  let deskripsiFinal = deskripsiLama;
  if (!deskripsiFinal || deskripsiFinal.includes("Gagal") || deskripsiFinal.includes("Error") || deskripsiFinal.includes("tidak tersedia")) {
     deskripsiFinal = isMinuman 
        ? `Kesegaran ${namaMenu} yang nikmat dengan rasa yang pas.`
        : `Hidangan ${namaMenu} lezat yang cocok untuk dinikmati kapan saja.`;
  }

  if (isMinuman) {
    return {
      description: deskripsiFinal,
      steps: [
        `Siapkan gelas bersih. Bahan: ${teksBahan || 'Sesuai takaran'}.`,
        `Masukkan bahan utama ke dalam gelas atau shaker.`,
        `Tambahkan es batu secukupnya.`,
        `Tuangkan air/susu/pelengkap hingga penuh.`,
        `Aduk rata dan sajikan dingin.`
      ]
    };
  } else {
    return {
      description: deskripsiFinal,
      steps: [
        `Siapkan bahan: ${teksBahan || 'Semua bahan'}. Cuci bersih.`,
        `Panaskan alat masak dengan api sedang.`,
        `Masak bahan utama hingga matang.`,
        `Tambahkan bumbu dan koreksi rasa.`,
        `Angkat dan sajikan hangat.`
      ]
    };
  }
};

const cleanJSON = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const mintaResepKeAI = async (namaMenu: string, deskripsiLama: string, listBahan: any[]) => {
  console.log(`🔥 [AI] Mencoba resep untuk: ${namaMenu}`);

  // --- LOGIKA PEMBERSIH SAMPAH (FIX ERROR) ---
  // Jika deskripsi lama isinya pesan error, kita anggap KOSONG biar dibuatkan baru
  if (deskripsiLama && (
      deskripsiLama.includes("Gagal memuat") || 
      deskripsiLama.includes("Error") || 
      deskripsiLama.includes("malformed") ||
      deskripsiLama.includes("404")
  )) {
      console.log("🧹 Menghapus deskripsi error lama...");
      deskripsiLama = ""; // Reset jadi kosong
  }
  // -------------------------------------------

  if (API_KEY) {
    const teksBahan = listBahan.map(b => 
      typeof b === 'object' ? `${b.jumlah || ''} ${b.satuan || ''} ${b.nama}` : b
    ).join(', ');

    const prompt = `
      Kamu Chef. Buatkan resep JSON untuk "${namaMenu}".
      BAHAN: ${teksBahan}.
      ATURAN: Sesuaikan langkah dengan bahan.
      Format JSON: { "desc": "deskripsi menarik (1 kalimat)", "step": ["Langkah 1", "Langkah 2"] }
    `;

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        text = cleanJSON(text);
        const awal = text.indexOf('{');
        const akhir = text.lastIndexOf('}');
        if (awal !== -1 && akhir !== -1) text = text.substring(awal, akhir + 1);

        const hasilJson = JSON.parse(text);

        console.log(`✅ SUKSES MODEL: ${model}`);
        
        // Pastikan deskripsi baru dipakai
        const deskripsiBaru = hasilJson.desc || hasilJson.description;

        return {
          description: deskripsiBaru || deskripsiLama || `Nikmati kelezatan ${namaMenu}.`,
          steps: hasilJson.step || hasilJson.steps || ["Berhasil!"]
        };

      } catch (e) {
        console.warn(`Gagal model ${model}, next...`);
      }
    }
  }

  return bikinResepDarurat(namaMenu, deskripsiLama, listBahan);
};