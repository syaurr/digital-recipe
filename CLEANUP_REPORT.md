# Laporan Pembersihan & Audit Keamanan Repository (CLEANUP REPORT)

**Repository:** `digital-recipe`  
**Branch:** `chore/professionalize`  
**Tanggal:** 4 November 2026  
**Auditor / Engineer:** Senior Software Engineer  

---

## 1. Ringkasan Eksekutif

Pembersihan dan refaktorisasi arsitektur telah diselesaikan pada branch baru `chore/professionalize` tanpa mengubah perilaku antarmuka pengguna maupun logika alur operasional aplikasi (*zero behavioral regression*). Seluruh build Vite berhasil diverifikasi sebelum dan sesudah perubahan dengan status **100% lulus (green build)**.

| Metrik | Sebelum Refaktorisasi | Sesudah Refaktorisasi |
|---|---|---|
| **Cabang Git** | `main` | `chore/professionalize` |
| **Ukuran Modul Transformasi Build** | 98 modules (523.95 kB) | 98 modules (523.65 kB) |
| **Dependensi Eksternal (npm)** | 10 packages (termasuk 3 SDK AI tidak terpakai) | 7 packages (113 sub-packages dilepas) |
| **Vektor Kebocoran AI Key** | Terekspos langsung di client bundle (`VITE_GROQ_API_KEY`) | Terisolasi di serverless function (`/api/generate-recipe`) |
| **Klien Supabase di Kru Management** | Inisialisasi ganda lokal (`createClient` independen) | Menggunakan factory terpusat (`createIsolatedClient`) |

---

## 2. Inventaris Perubahan File

Semua file ambigu telah dipindahkan ke direktori `docs/archive/` (bukan dihapus) sesuai aturan ketat penanganan aset portofolio.

| File | Status | Kategori | Alasan / Justifikasi |
|---|---|---|---|
| `metadata.json` | Dipindah ke `docs/archive/metadata.json` | Pembersihan Scaffold | Artefak otomatis bawaan Google AI Studio; tidak diperlukan untuk runtime Vite/React. |
| `components/AddCrewModal.tsx` | Dipindah ke `docs/archive/AddCrewModal.tsx` | File Ambigu (Unused) | Modal CRUD kru lama untuk tabel `crews`; tidak pernah di-import di file mana pun karena `CrewManagement.tsx` sudah memiliki modal mandiri untuk tabel `profiles`. |
| `components/ImportCSVModal.tsx` | Dipindah ke `docs/archive/ImportCSVModal.tsx` | File Ambigu (Unused) | Komponen import CSV lama yang tidak lagi direferensikan dalam `AdminDashboard.tsx` atau routing aktif. |
| `api/generate-recipe.ts` | Dibuat baru | Fitur Keamanan | Vercel Serverless Function sebagai proksi aman untuk Groq Llama 3.1 & Gemini 1.5 Flash. Mencegah eksposur API key ke browser. |
| `.env.example` | Dibuat baru | Dokumentasi & Setup | Template variabel lingkungan aman tanpa memuat nilai kredensial rahasia. |
| `services/aiResepBaru.ts` | Dimodifikasi | Refaktorisasi Keamanan | Mengalihkan fetch langsung Groq ke backend endpoint internal `/api/generate-recipe`. Menghilangkan ketergantungan `import.meta.env.VITE_GROQ_API_KEY`. |
| `services/supabaseClient.ts` | Dimodifikasi | Standarisasi Arsitektur | Menambahkan helper `createIsolatedClient()` dan membersihkan log debug (`console.log`). |
| `pages/CrewManagement.tsx` | Dimodifikasi | Standarisasi Arsitektur | Menghapus import langsung `@supabase/supabase-js`, kini menggunakan `createIsolatedClient()` dari `services/supabaseClient.ts`. |
| `package.json` & `package-lock.json` | Dimodifikasi | Optimasi Dependensi | Menghapus `@google/genai`, `@google/generative-ai`, dan `groq-sdk` yang terbukti tidak di-import di codebase. |
| `vercel.json` | Dimodifikasi | Routing Konfigurasi | Memperbarui regex rewrites `source: "/((?!api/).*)"` agar endpoint serverless `/api/*` tidak tertelan rewrite SPA `/index.html`. |
| `vite-env.d.ts` | Dimodifikasi | Type Safety | Menghapus deklarasi `VITE_GROQ_API_KEY` dari tipe environment Vite. |
| `README.md` | Ditulis Ulang | Portofolio Profesional | Ditulis ulang dalam Bahasa Indonesia profesional untuk rekruter teknis (arsitektur Mermaid, fitur dari kode, kontributor dari git log, panduan jalankan). |

---

## 3. Temuan Keamanan (Diurutkan dari Tingkat Terberat)

### [KRITIS #1] Kredensial Rahasia (API Keys) Bocor Permanen di Riwayat Git Commit
* **Tingkat Keparahan:** KRITIS (High-Severity Incident)
* **Deskripsi:** Ditemukan sejumlah API key aktif yang pernah di-commit langsung ke riwayat git:
  1. **Google Gemini API Key:** `AIzaSyAb1i8fp-fZ9IYbR1-aljzHJz1cYfcpaRM`  
     *Lokasi:* `services/aiResepBaru.ts` pada commit `f303b93` (baris 3).
  2. **Google Gemini API Key:** `AIzaSyC7KxMJUFVZOuLShqDMc7v7YK0_8cImGhQ`  
     *Lokasi:* `services/geminiService.ts` pada commit `afe1e53` (baris 4).
  3. **Groq Cloud API Key:** `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`  
     *Lokasi:* `services/geminiService.ts` pada commit `afe1e53` dan `7945fd7` (baris 1).
  4. **Groq Cloud API Key:** `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`  
     *Lokasi:* `services/aiResepBaru.ts` pada commit `f1a818d` (baris 3).
  5. **Groq Cloud API Key di Lingkungan Kerja Lokal:** `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`  
     *Lokasi:* file lokal `.env.local` baris 1 (beruntung file ini diabaikan oleh `.gitignore` dan belum masuk commit HEAD, namun pernah digunakan di client).
* **Dampak:** Siapa pun yang memiliki akses ke repository (atau jika repository diubah menjadi publik) dapat membaca riwayat commit dan menggunakan kuota API Groq/Gemini Anda tanpa izin.
* **Tindakan yang Harus Dilakukan:** **Kunci-kunci di atas HARUS segera dicabut (revoke/delete) melalui dashboard masing-masing penyedia (console.groq.com dan aistudio.google.com).**

---

### [KRITIS #2] Pemanggilan API AI Langsung dari Browser Client (`VITE_GROQ_API_KEY`)
* **Tingkat Keparahan:** KRITIS (Sudah Dimitigasi)
* **Deskripsi:** Sebelumnya, `services/aiResepBaru.ts` membaca `import.meta.env.VITE_GROQ_API_KEY` dan langsung memanggil `https://api.groq.com/openai/v1/chat/completions` dari browser pengguna. Di Vite, seluruh variabel dengan prefiks `VITE_` dimasukkan ke dalam bundel JavaScript publik.
* **Status Mitigasi:** **SELESAI.** Seluruh pemanggilan AI telah dipindahkan ke Vercel Serverless Function di `api/generate-recipe.ts`. Kunci rahasia kini disimpan di environment variable server (`GROQ_API_KEY` atau `GEMINI_API_KEY`) tanpa prefiks `VITE_`.

---

### [KRITIS #3] Otorisasi Admin di Sisi Client Berbasis String Email (Bypassable)
* **Tingkat Keparahan:** KRITIS
* **Deskripsi:** 
  1. Pembatasan rute admin (`/admin`, `/admin/kategori`, `/admin/resep/*`, `/crew`) hanya dilakukan di sisi peramban pada `ProtectedRoute.tsx` dan `AuthContext.tsx` dengan membandingkan string email:
     ```ts
     // context/AuthContext.tsx
     if (userEmail.startsWith('balista')) {
       finalProfile = { ...profileData, role: 'crew' };
     } else if (userEmail === 'tasya.officebalista@gmail.com') {
       finalProfile = { ...profileData, role: 'admin' };
     }
     ```
  2. Mutasi role kru menjadi admin pada `pages/CrewManagement.tsx` (baris 141) dilakukan via query Supabase client langsung:
     ```ts
     await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
     ```
* **Dampak:** Jika Row Level Security (RLS) di database Supabase tidak dikonfigurasi dengan ketat, pengguna dengan hak akses crew (atau siapa saja yang memiliki token autentikasi anon) dapat mengirimkan query `UPDATE` atau `DELETE` langsung ke REST API Supabase (`https://<project-id>.supabase.co/rest/v1/...`) untuk mengubah role akun mereka sendiri menjadi `admin` atau menghapus seluruh resep dapur.
* **Rencana Perbaikan:** Disusun pada Bagian 4 laporan ini.

---

### [TINGGI #4] Paparan Informasi Pribadi dan Data Sensitif Bisnis di Kode Sumber
* **Tingkat Keparahan:** TINGGI
* **Deskripsi:**
  1. Email pribadi pengembang/manajemen tertulis eksplisit (*hardcoded*) di kode sumber:
     - `pages/CrewManagement.tsx` (baris 136)
     - `context/AuthContext.tsx` (baris 35)
     - `pages/Login.tsx` (baris 146 dan 197)
  2. Nama menu dan kategori bisnis kuliner asli (`EXCLUSION_LIST` di `pages/admin/RecipeForm.tsx` baris 10: `"Takoyaki & okonomiyaki"`, `"mentai rice"`, dll.).
  3. Klausul hukum internal restoran di `index.html` (baris 390-399) dan `components/SecurityOverlay.tsx` (baris 148-150).
* **Dampak:** Membuka informasi internal organisasi, pemilik sistem, dan formula klasifikasi menu kepada pihak luar saat repository dijadikan portofolio publik.

---

### [SEDANG #5] Kerentanan Paket Dependensi Transitif (`npm audit`)
* **Tingkat Keparahan:** SEDANG (Moderate to High Vulnerability)
* **Hasil Audit:** 10 kerentanan terdeteksi (1 Low, 1 Moderate, 8 High):
  1. `react-router` (6.0.0 - 7.18.1): Vendored turbo-stream deserialization, potensi open-redirect, dan route matching DoS (GHSA-49rj-9fvp-4h2h, GHSA-wrjc-x8rr-h8h6).
  2. `vite` (<=6.4.3): Path traversal & launch-editor execution bypass pada sistem Windows (GHSA-v6wh-96g9-6wx3, GHSA-fx2h-pf6j-xcff).
  3. `postcss` (<=8.5.22): Source map auto-loading path traversal (GHSA-r28c-9q8g-f849).
  4. `ws` (8.0.0 - 8.20.1): Memory exhaustion DoS via tiny fragments (GHSA-96hv-2xvq-fx4p).
* **Catatan:** Seluruh kerentanan ini berasal dari paket transitif tooling development dan rendering routing, bukan dari dependensi langsung aplikasi. Menjalankan `npm audit fix` berpotensi menaikkan versi minor/patch yang memerlukan pengujian fungsionalitas ulang.

---

## 4. Rencana Pembatasan Akses Admin & Login (Action Plan)

*(Rencana ini TIDAK diterapkan dalam kode saat ini sesuai instruksi, untuk diimplementasikan secara terencana)*

### Fase 1: Database Migration & RLS Policy (Supabase Dashboard)
1. **Buat ENUM Role di PostgreSQL:**
   ```sql
   CREATE TYPE app_role AS ENUM ('admin', 'crew');
   ```
2. **Kunci Tabel `profiles`:**
   Pastikan kolom `role` pada tabel `profiles` tidak dapat diubah oleh pengguna biasa:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Kru dan Admin hanya bisa membaca profil
   CREATE POLICY "Allow authenticated read profiles"
   ON profiles FOR SELECT TO authenticated
   USING (true);

   -- Hanya Admin yang boleh memperbarui profil / role pengguna lain
   CREATE POLICY "Allow admin update profiles"
   ON profiles FOR UPDATE TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
     )
   );
   ```
3. **Kunci Tabel `resep` dan `kategori`:**
   ```sql
   ALTER TABLE resep ENABLE ROW LEVEL SECURITY;
   ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;

   -- Semua kru terautentikasi dapat melihat resep (SELECT)
   CREATE POLICY "Allow read recipes for staff"
   ON resep FOR SELECT TO authenticated USING (true);

   -- Hanya role admin yang boleh INSERT, UPDATE, DELETE
   CREATE POLICY "Allow write recipes for admin only"
   ON resep FOR ALL TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
     )
   );
   ```

### Fase 2: Supabase Custom Claims (JWT Auth)
1. Manfaatkan Supabase Auth Hook / Custom Claims (`app_metadata`) agar claim `role` disematkan langsung di dalam JWT token.
2. Dengan begitu, verifikasi otorisasi di Supabase database tidak perlu melakukan sub-query ke tabel `profiles` berulang kali, melainkan langsung membaca `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`.

### Fase 3: Refaktorisasi Client Code (React)
1. **Hapus Hardcoded Email:**
   Hapus logika `userEmail.startsWith('balista')` dan `tasya.officebalista@gmail.com`.
2. **Gunakan Nilai Role Database / JWT:**
   Jadikan `profile.role` dari respon terotentikasi sebagai satu-satunya penentu navigasi.
3. **Backend Service Role untuk Manajemen Akun:**
   Pembuatan kru baru (`auth.signUp`) dan pengubahan role sebaiknya dialihkan ke Vercel Serverless Function yang memegang `SUPABASE_SERVICE_ROLE_KEY` di server, sehingga admin tidak perlu mengekspos logika manipulasi user di client-side.

---

## 5. Keputusan Manual yang Harus Diambil Tasya

Tindakan-tindakan berikut ini berada di luar ruang lingkup otomatisasi kode dan wajib dilakukan secara manual oleh pemilik repository:

1. **[MENDESAK] Cabut Kunci API Lama di Dashboard Groq & Google AI Studio:**
   - Masuk ke [Groq Console](https://console.groq.com/keys) dan hapus (*delete/revoke*) API key lama:
     - `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`
     - `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`
     - `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`
   - Masuk ke [Google AI Studio](https://aistudio.google.com/app/apikey) dan hapus API key lama:
     - `AIzaSyAb1i8fp-fZ9IYbR1-aljzHJz1cYfcpaRM`
     - `AIzaSyC7KxMJUFVZOuLShqDMc7v7YK0_8cImGhQ`
   - Buat kunci baru, lalu masukkan ke pengaturan **Vercel Project Settings > Environment Variables** dengan nama `GROQ_API_KEY` atau `GEMINI_API_KEY`.

2. **Pembersihan Riwayat Git (Opsional jika ingin Open-Source):**
   - Karena kunci rahasia pernah ter-commit di masa lalu pada branch `main` (`f303b93`, `f1a818d`, `afe1e53`, `7945fd7`), riwayat tersebut masih tersimpan di objek `.git`.
   - Jika repository ini akan dibuka ke publik di GitHub, jalankan tools seperti `git-filter-repo` atau [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) untuk menghapus jejak string kredensial dari seluruh riwayat commit sebelum repositori dipublikasikan.

3. **Pengambilan Tangkapan Layar (Screenshots) Dummy Data:**
   - Jalankan `npm run dev`, ambil screenshot tampilan UI dengan resep dummy non-rahasia, lalu unggah gambarnya dan perbarui bagian `TODO(Tasya): ...` pada `README.md`.

4. **Pembaruan Informasi Portofolio Tambahan:**
   - Lengkapi rincian tugas non-coding (seperti wawancara alur dapur restoran, riset operasional, dan pengujian lapangan) pada tabel kontributor di `README.md`.

