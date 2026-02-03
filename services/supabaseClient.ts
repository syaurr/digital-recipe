import { createClient } from '@supabase/supabase-js';

// Ambil variabel dari .env
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Debugging: Cek di Console apakah terbaca
console.log("=== STATUS KONEKSI ===");
console.log("Supabase URL:", supabaseUrl ? "✅ Ada" : "❌ HILANG (Undefined)");
console.log("Supabase Key:", supabaseAnonKey ? "✅ Ada" : "❌ HILANG (Undefined)");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("FATAL ERROR: Supabase URL atau Key belum disetting di .env.local");
}

// Buat koneksi (Gunakan string kosong jika undefined agar tidak crash total saat loading awal)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
);

// Fungsi cek status sederhana
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;