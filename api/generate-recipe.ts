export default async function handler(req: any, res: any) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    if (res?.status) {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const namaMenu = body.namaMenu || body.nama || '';
    const bahan = typeof body.bahan === 'string' ? body.bahan : JSON.stringify(body.bahan || '');
    const alat = Array.isArray(body.alat) ? body.alat.join(', ') : body.alat || '';

    if (!namaMenu) {
      const errPayload = { error: 'Nama menu wajib diisi' };
      if (res?.status) return res.status(400).json(errPayload);
      return new Response(JSON.stringify(errPayload), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      const errPayload = {
        error: 'API Key server belum dikonfigurasi (GROQ_API_KEY atau GEMINI_API_KEY)',
      };
      if (res?.status) return res.status(500).json(errPayload);
      return new Response(JSON.stringify(errPayload), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Buat SOP detail untuk menu: "${namaMenu}". Bahan: ${bahan}. Alat: ${alat}. 
WAJIB JSON MURNI: {
    "description": "1 kalimat deskripsi menarik",
    "steps": ["Langkah 1...", "Langkah 2...", "Langkah 3..."]
}`;

    // 1. Coba Groq jika ada key-nya
    if (groqKey) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (groqResponse.ok) {
        const groqResult = await groqResponse.json();
        const content = groqResult.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        if (res?.status) return res.status(200).json(parsed);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fallback ke Gemini jika Groq gagal atau key tidak ada
    if (geminiKey) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (geminiResponse.ok) {
        const geminiResult = await geminiResponse.json();
        const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(rawText);
        if (res?.status) return res.status(200).json(parsed);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const failPayload = { error: 'Gagal menghubungi penyedia AI' };
    if (res?.status) return res.status(502).json(failPayload);
    return new Response(JSON.stringify(failPayload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const errorPayload = { error: err.message || 'Terjadi kesalahan pada server' };
    if (res?.status) return res.status(500).json(errorPayload);
    return new Response(JSON.stringify(errorPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
