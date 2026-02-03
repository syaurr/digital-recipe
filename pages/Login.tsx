import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getSupabaseErrorMessage } from '../services/errorUtils';

const BalistaLogo = () => (
    <div className="flex items-center justify-center space-x-3 mb-3">
        <img src="/logo.png" alt="Balista Logo" className="w-20 h-20 object-cover" />
    </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('Login must be used within an AuthProvider');
  }
  const { session, loading: authLoading } = authContext;

  useEffect(() => {
    if (!authLoading && session) {
      navigate('/', { replace: true });
    }
  }, [session, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Email atau password salah.'));
    } else {
      toast.success('Login berhasil!');
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  if (authLoading) {
     return <div className="flex items-center justify-center h-screen bg-balista-background">Memuat...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-balista-background dark:bg-balista-primary p-4">
      <div className="max-w-md w-full bg-white dark:bg-balista-muted p-8 rounded-2xl shadow-2xl">
        <BalistaLogo />
        <h2 className="text-xl font-semibold text-center text-balista-primary dark:text-white mb-6">Login Buku Resep</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-balista-primary dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-balista-primary dark:text-gray-300 bg-gray-100 dark:bg-balista-primary leading-tight focus:outline-none focus:ring-2 focus:ring-balista-secondary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@anda.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-balista-primary dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-balista-primary dark:text-gray-300 bg-gray-100 dark:bg-balista-primary mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-balista-secondary"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******************"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-balista-secondary hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full disabled:bg-opacity-50 transition-all duration-300"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;