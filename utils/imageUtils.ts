// 🟢 FILE: src/utils/imageUtils.ts

export const getGoogleDriveImageUrl = (url: string | null | undefined): string => {
  // 1. Cek jika data kosong, NULL, atau bertuliskan "EMPTY"
  if (!url || url === "NULL" || url === "EMPTY" || url.trim() === "") {
    return ""; // Akan mentrigger onError di Home.tsx
  }

  const cleanUrl = url.trim();

  // 2. Jika link sudah berupa format 'lh3.googleusercontent' (Direct Link)
  // Biasanya ini link hasil copy-paste langsung dari inspect element Google
  if (cleanUrl.includes("googleusercontent.com")) {
    // Kita coba ambil ID-nya saja biar seragam pakai thumbnail endpoint
    const idMatch = cleanUrl.match(/\/d\/([^/]+)/);
    if (idMatch && idMatch[1]) {
       return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
    // Jika tidak ketemu ID-nya, kembalikan link aslinya (mungkin masih bisa jalan)
    return cleanUrl;
  }

  // 3. Regex Standar Google Drive (id=..., /d/..., open?id=...)
  const regex = /(?:id=|\/d\/|open\?id=)([\w-]+)/;
  const match = cleanUrl.match(regex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  // 4. Jika bukan link Google Drive sama sekali (misal link website lain)
  return cleanUrl;
};