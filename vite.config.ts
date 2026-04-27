import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Konfigurasi Utama Vite
export default defineConfig({
  server: {
    port: 3000,        // Memaksa aplikasi jalan di port 3000
    strictPort: true,  // PENTING: Mencegah aplikasi pindah ke port lain jika port 3000 sibuk
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});