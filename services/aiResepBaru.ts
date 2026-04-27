const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const generateRecipeDetails = async (payload: any) => {
    // Menyesuaikan dengan struktur data yang dikirim dari RecipeForm/AdminDashboard
    const namaMenu = payload.namaMenu || payload.nama || "";
    const bahan = payload.bahan || "";
    const alat = payload.alat || "";
    
    if (!GROQ_API_KEY) {
        console.error("API Key Groq tidak ditemukan di .env.local");
        return null;
    }

    const prompt = `Buat SOP detail untuk menu: "${namaMenu}". Bahan: ${bahan}. Alat: ${alat}. 
    WAJIB JSON MURNI: {
        "description": "1 kalimat deskripsi menarik",
        "steps": ["Langkah 1...", "Langkah 2...", "Langkah 3..."]
    }`;

    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // Model yang kamu pilih, super cepat!
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2,
            }),
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error?.message || "Gagal menghubungi AI");
        }

        return JSON.parse(result.choices[0].message.content);
    } catch (error) {
        console.error("AI Error:", error);
        return null;
    }
};