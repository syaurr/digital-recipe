
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center px-4">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-white">404</h1>
      <p className="text-2xl mt-4 text-gray-600 dark:text-gray-300">Halaman Tidak Ditemukan</p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
      <Link 
        to="/" 
        className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
};

export default NotFound;
