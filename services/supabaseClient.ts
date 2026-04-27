import { createClient } from '@supabase/supabase-js';

// Tarik URL dan Key dari .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;

console.log("🔥 Koneksi Supabase Berhasil Diaktifkan");