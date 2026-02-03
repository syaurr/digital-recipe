import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'admin' | 'crew'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  const [debugData, setDebugData] = useState<any>(null);
  const [debugError, setDebugError] = useState<any>(null);

  if (!authContext) throw new Error('AuthContext missing');
  const { session, profile, loading, signOut } = authContext;

  // --- DIAGNOSA SUPER DETAIL ---
  useEffect(() => {
    const runDiagnostics = async () => {
      if (session) {
        // 1. Coba ambil SEMUA data di tabel profiles (tanpa filter ID)
        // Ini untuk mengecek apakah aplikasi "melihat" tabel yang sama dengan SQL Editor
        const { data, error } = await supabase.from('profiles').select('*');
        setDebugData(data);
        setDebugError(error);
        
        console.log("--- HASIL DIAGNOSA ---");
        console.log("Data di tabel profiles:", data);
        console.log("Error (jika ada):", error);
        console.log("ID saya:", session.user.id);
      }
    };
    runDiagnostics();
  }, [session]);
  // -----------------------------

  if (loading) return <div className="p-10 text-center">Sedang Memuat...</div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  // Jika Profil tidak ditemukan, TAMPILKAN HASIL DIAGNOSA DI LAYAR
  if (!profile) {
    return (
      <div className="p-8 bg-gray-100 min-h-screen font-mono text-sm">
        <div className="bg-white p-6 rounded shadow-lg max-w-4xl mx-auto border-l-4 border-red-500">
          <h1 className="text-2xl font-bold text-red-600 mb-4">MODE DIAGNOSA DATABASE</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-bold">ID Login Anda (Auth):</h3>
              <p className="break-all">{session.user.id}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <h3 className="font-bold">Status Koneksi Tabel:</h3>
              <p>{debugError ? "GAGAL TERHUBUNG" : "TERHUBUNG"}</p>
            </div>
          </div>

          <h3 className="font-bold mb-2">Isi Tabel 'profiles' yang dilihat Aplikasi:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded overflow-auto h-64 mb-4">
            {debugError ? (
               <span className="text-red-400">ERROR: {JSON.stringify(debugError, null, 2)}</span>
            ) : debugData && debugData.length === 0 ? (
               <span className="text-yellow-400">TABEL KOSONG [] (Aplikasi tidak melihat data apapun)</span>
            ) : (
               <pre>{JSON.stringify(debugData, null, 2)}</pre>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold">Analisis Masalah:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {debugError && <li>Kunci API atau URL Salah. Cek console.</li>}
              {debugData && debugData.length === 0 && (
                  <li className="text-red-600 font-bold">
                      FATAL: Tabel terbaca KOSONG. Anda terhubung ke Proyek Supabase yang SALAH. Cek URL di supabaseClient.ts vs Dashboard.
                  </li>
              )}
              {debugData && debugData.length > 0 && !debugData.find((d:any) => d.id === session.user.id) && (
                  <li className="text-red-600 font-bold">
                      ID TIDAK COCOK: Data ada, tapi ID login Anda ({session.user.id.substring(0,6)}...) tidak ada di daftar. Cek JSON di atas.
                  </li>
              )}
            </ul>
          </div>

          <button onClick={() => signOut()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 w-full">
            Logout & Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return <div>Akses Ditolak (Role Salah)</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;