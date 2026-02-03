import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
// import { generateRecipeSteps } from '../services/geminiService'; // AI Off (Mode Cepat)
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import type { Bahan } from '../types';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

// === FIX: Link Converter Versi Paling Stabil ===
const getDirectLink = (url: string) => {
  if (!url) return "";
  
  // 1. Cari ID Google Drive (kombinasi huruf/angka acak 25+ karakter)
  const idMatch = url.match(/[-\w]{25,}/);
  
  if (idMatch) {
    // Menggunakan server lh3 yang lebih cepat & stabil untuk gambar
    // Syntax yang benar menggunakan `${}`
    return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
  }

  // Jika bukan link Google Drive, kembalikan apa adanya
  return url;
};

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('kategori').select('id, nama');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setFile(event.target.files[0]);
  };

  const handleImport = useCallback(async () => {
    if (!file) {
      toast.error('Silakan pilih file CSV terlebih dahulu.');
      return;
    }

    setLoading(true);
    setProgress('Menganalisa struktur CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";", 
      transformHeader: (header) => header.trim().replace(/^[\uFEFF\uFFFE]/, '').toLowerCase(), 
      complete: async (results) => {
        const rows = results.data as any[];

        if (rows.length === 0) {
          toast.error("File CSV kosong!");
          setLoading(false);
          return;
        }

        let successCount = 0;
        let updateCount = 0;
        let failCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const namaMenu = row.nama; 

          if (!namaMenu) continue;

          try {
            setProgress(`Memproses ${i + 1}/${rows.length}: ${namaMenu}...`);

            // 1. CEK KATEGORI
            let catName = row.kategori_nama || row.kategori || "Uncategorized";
            catName = catName.trim();
            let category = categories.find(c => c.nama.toLowerCase() === catName.toLowerCase());
            
            if (!category) {
              const { data: newCat, error: catError } = await supabase
                .from('kategori')
                .insert({ nama: catName })
                .select()
                .single();
              if (catError) throw new Error(`Gagal buat kategori ${catName}`);
              category = newCat;
              setCategories(prev => [...prev, newCat]); 
            }

            // 2. PARSING DATA
            let bahanFinal: Bahan[] = [];
            if (row.bahan) {
              const separator = row.bahan.includes(';') ? ';' : ',';
              bahanFinal = row.bahan.split(separator).map((b: string) => {
                const parts = b.split('|');
                return {
                   nama: parts[0]?.trim(),
                   jumlah: parseFloat(parts[1]) || 0,
                   satuan: parts[2]?.trim() || 'secukupnya'
                };
              }).filter((b: any) => b.nama);
            }

            let alatFinal: string[] = [];
            if (row.alat) {
              const separator = row.alat.includes(';') ? ';' : ',';
              alatFinal = row.alat.split(separator).map((a: string) => a.trim()).filter((a: string) => a);
            }

            let langkahFinal: string[] = [];
            let deskripsiFinal = row.deskripsi || "";
            
            if (row.langkah) {
               langkahFinal = row.langkah.split(';').map((l: string) => l.trim());
            } else {
               langkahFinal = ["Siapkan bahan-bahan.", "Sajikan sesuai selera."];
            }

            // 3. CONVERT FOTO (PENTING!)
            // Pastikan row.foto_url ada isinya di Excel. Kalau kosong, hasilnya ""
            const fotoUrlFinal = getDirectLink(row.foto_url || '');

            // 4. SIMPAN KE DATABASE
            const { data: existingMenu } = await supabase
              .from('resep')
              .select('id')
              .ilike('nama', namaMenu)
              .maybeSingle();

            const resepData = {
              nama: namaMenu,
              deskripsi: deskripsiFinal,
              kategori_id: category.id,
              foto_url: fotoUrlFinal, 
              bahan: bahanFinal,
              alat: alatFinal,
              langkah: langkahFinal,
              potongan: row.potongan || null
            };

            if (existingMenu) {
               const { error: upErr } = await supabase.from('resep').update(resepData).eq('id', existingMenu.id);
               if(upErr) throw upErr;
               updateCount++;
            } else {
               const { error: inErr } = await supabase.from('resep').insert(resepData);
               if(inErr) throw inErr;
               successCount++;
            }

          } catch (err: any) {
            console.error(`Gagal import ${namaMenu}:`, err);
            failCount++;
          }
        }

        setLoading(false);
        setFile(null);
        toast.success(`Selesai! Masuk: ${successCount}, Update: ${updateCount}`);
        onImportSuccess();
        onClose();
      },
      error: (err) => {
        setLoading(false);
        toast.error(`Error file CSV: ${err.message}`);
      }
    });
  }, [file, categories, onClose, onImportSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Import Resep (Fix Foto)</h2>
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
           <strong>Cek Excel:</strong> Pastikan kolom <code>foto_url</code> di Excel sudah diisi link Google Drive. Jika kolomnya kosong, gambar tidak akan muncul.
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-4"
        />
        {loading && (
           <div className="mb-4 text-center">
             <div className="animate-spin inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mb-2"></div>
             <p className="text-sm text-green-600 font-medium">{progress}</p>
           </div>
        )}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800">Batal</button>
          <button onClick={handleImport} disabled={loading || !file} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Memproses...' : 'Mulai Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;