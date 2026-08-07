// services/errorUtils.ts
// Enhanced error categorization untuk Supabase

export type SupabaseErrorType = 'auth' | 'network' | 'generic';

/**
 * Mengkategorikan error dari Supabase ke dalam tipe yang sudah dikenali.
 * 'auth'    → Salah email atau password
 * 'network' → Koneksi gagal, server down, timeout
 * 'generic' → Error lainnya
 */
export const categorizeSupabaseError = (error: any): SupabaseErrorType => {
  if (!error) return 'generic';

  const msg = (error?.message || '').toLowerCase();
  const status = error?.status || 0;

  // Error autentikasi — salah email/password
  const authKeywords = [
    'invalid login credentials',
    'invalid email or password',
    'email not confirmed',
    'user not found',
    'invalid password',
    'invalid credentials',
  ];
  if (authKeywords.some(k => msg.includes(k)) || status === 400 || status === 401) {
    return 'auth';
  }

  // Error network/server — koneksi gagal, timeout, database down
  const networkKeywords = [
    'failed to fetch',
    'network error',
    'networkerror',
    'fetch error',
    'timeout',
    'etimedout',
    'econnrefused',
    'connection refused',
    'service unavailable',
    'gateway timeout',
    'bad gateway',
    'upstream connect error',
    'cannot read properties of undefined',
  ];
  if (
    networkKeywords.some(k => msg.includes(k)) ||
    status === 0 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 524
  ) {
    return 'network';
  }

  return 'generic';
};

/**
 * Mengembalikan pesan user-friendly berdasarkan kategori error.
 * TIDAK pernah menampilkan pesan mentah dari Supabase.
 */
export const getFriendlyErrorMessage = (error: any): {
  type: SupabaseErrorType;
  title: string;
  message: string;
} => {
  const type = categorizeSupabaseError(error);

  switch (type) {
    case 'auth':
      return {
        type,
        title: 'Login Gagal',
        message: 'Email atau Password tidak cocok.',
      };
    case 'network':
      return {
        type,
        title: 'Koneksi Bermasalah',
        message: 'Sistem sedang gangguan, hubungi manajemen.',
      };
    default:
      return {
        type,
        title: 'Terjadi Kesalahan',
        message: 'Sistem sedang gangguan, hubungi manajemen.',
      };
  }
};

/**
 * Legacy helper — dipertahankan untuk backward compatibility.
 */
export const getSupabaseErrorMessage = (error: any, defaultMessage: string): string => {
  const { message } = getFriendlyErrorMessage(error);
  return message || defaultMessage;
};
