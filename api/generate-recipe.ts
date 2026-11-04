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
    // 1. Verifikasi Autentikasi Sesi Supabase (Anti-Open Proxy)
    const authHeader =
      req.headers?.authorization ||
      req.headers?.Authorization ||
      (typeof req.headers?.get === 'function' ? req.headers.get('authorization') : null);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const errPayload = { error: 'Akses ditolak: Token autentikasi sesi Supabase diperlukan' };
        if (res?.status) return res.status(401).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userRes = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        headers: {
          Authorization: authHeader,
          apikey: supabaseAnonKey,
        },
      });

      if (!userRes.ok) {
        const errPayload = { error: 'Akses ditolak: Sesi tidak valid atau telah kedaluwarsa' };
        if (res?.status) return res.status(401).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const namaMenu = String(body.namaMenu || body.nama || '').trim();
    const bahan = typeof body.bahan === 'string' ? body.bahan.trim() : JSON.stringify(body.bahan || '');
    const alat = Array.isArray(body.alat) ? body.alat.join(', ').trim() : String(body.alat || '').trim();

    if (!namaMenu) {
      const errPayload = { error: 'Nama menu wajib diisi' };
      if (res?.status) return res.status(400).json(errPayload);
      return new Response(JSON.stringify(errPayload), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Pembatasan Panjang Input untuk Mencegah Abuse / Payload Flooding
    if (namaMenu.length > 200 || bahan.length > 4000 || alat.length > 1000) {
      const errPayload = { error: 'Input melebihi batas panjang maksimum yang diizinkan' };
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

    // 3. Panggil Groq jika kunci tersedia (dibatasi max_tokens: 1000)
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
          max_tokens: 1000,
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

    // 4. Fallback ke Gemini jika Groq gagal atau kunci tidak ada (dibatasi maxOutputTokens: 1000)
    if (geminiKey) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 1000,
            },
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

