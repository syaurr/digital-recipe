// services/errorUtils.ts

/**
 * Processes a Supabase error object to return a more user-friendly message.
 * Specifically checks for "Failed to fetch" and suggests a configuration issue.
 * @param {any} error The error object from Supabase.
 * @param {string} defaultMessage A default message to use if the error is not specific.
 * @returns {string} A user-friendly error message.
 */
export const getSupabaseErrorMessage = (error: any, defaultMessage: string): string => {
    if (error?.message?.toLowerCase().includes('failed to fetch')) {
        return 'Gagal terhubung ke server. Pastikan koneksi internet Anda stabil dan konfigurasi Supabase (URL & Key) sudah benar.';
    }
    return error?.message || defaultMessage;
};
