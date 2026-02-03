
export interface Bahan {
  nama: string;
  jumlah: number;
  satuan: string;
}

export interface Kategori {
  id: string;
  nama: string;
  created_at: string;
}

export interface Resep {
  id: string;
  nama: 'string';
  kategori_id: string;
  deskripsi: string | null;
  foto_url: string;
  bahan: Bahan[];
  alat: string[];
  langkah: string[];
  potongan: string | null;
  created_at: string;
  kategori: {
      nama: string;
  } | null;
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'crew';
}
