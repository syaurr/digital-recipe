// utils/imageUtils.ts

export const getGoogleDriveImageUrl = (url: string | null | undefined) => {
  // 1. Validasi jika data kosong atau NULL dari database
  if (!url || url === 'NULL' || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000'; // Gambar cadangan
  }

  const cleanUrl = url.trim();

  // 2. Regex untuk menangkap ID Google Drive (biasanya 33 karakter)
  const driveIdMatch = cleanUrl.match(/(?:\/d\/|id=)([-\w]{25,})/);
  
  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    // PERBAIKAN: Gunakan ${fileId} dengan tanda dollar agar variabel terbaca
    // Menggunakan endpoint lh3 yang jauh lebih cepat untuk render gambar
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 3. Jika input bukan link Drive (misal link unsplash/eksternal), kembalikan aslinya
  return cleanUrl;
};