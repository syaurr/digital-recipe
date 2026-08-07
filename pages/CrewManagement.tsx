import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDevice = (ua: string): { browser: string; os: string; isMobile: boolean } => {
  if (!ua) return { browser: '—', os: '—', isMobile: false };

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  let browser = 'Browser Lain';
  if (/Edg\//i.test(ua))         browser = 'Microsoft Edge';
  else if (/OPR\//i.test(ua))    browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua))browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  let os = 'OS Lain';
  if (/Windows NT/i.test(ua))    os = 'Windows';
  else if (/iPhone/i.test(ua))   os = 'iPhone iOS';
  else if (/iPad/i.test(ua))     os = 'iPad iPadOS';
  else if (/Android/i.test(ua))  os = 'Android';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua))    os = 'Linux';

  return { browser, os, isMobile };
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const SessionBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 999, fontSize: 10,
      fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
      background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.15)',
      color: isActive ? '#16a34a' : '#9ca3af',
      border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'rgba(156,163,175,0.3)'}`,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: isActive ? '#22c55e' : '#9ca3af',
      boxShadow: isActive ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
      flexShrink: 0,
      ...(isActive ? { animation: 'pulse 2s infinite' } : {}),
    }} />
    {isActive ? 'Aktif' : 'Tidak Aktif'}
  </span>
);

// ─── Device Icon ──────────────────────────────────────────────────────────────

const DeviceIcon = ({ isMobile }: { isMobile: boolean }) => isMobile ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface AccountInfo {
  id: string;
  email: string;
  role: string;
  isCurrentSession: boolean;
  currentDevice: { browser: string; os: string; isMobile: boolean } | null;
}

const CrewManagement = () => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'crew' });
  const [newPassword, setNewPassword] = useState({ password: '', confirm: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || null;
      setCurrentUserId(currentId);
      const currentDevice = parseDevice(navigator.userAgent);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role');

      if (profileError) throw profileError;

      const enriched: AccountInfo[] = (profileData || []).map((p: any) => ({
        id: p.id,
        email: p.email || '—',
        role: p.role || 'crew',
        isCurrentSession: p.id === currentId,
        currentDevice: p.id === currentId ? currentDevice : null,
      }));

      // Sort current session to top
      enriched.sort((a, b) => Number(b.isCurrentSession) - Number(a.isCurrentSession));

      setAccounts(enriched);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data akun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const currentUserRole = accounts.find(a => a.id === currentUserId)?.role || 'crew';

  const toggleRole = async (profileId: string, currentRole: string) => {
    const target = accounts.find(a => a.id === profileId);
    if (target?.email === 'tasya.officebalista@gmail.com') {
      toast.error('Role Admin Utama tidak bisa diubah.');
      return;
    }
    const newRole = currentRole === 'admin' ? 'crew' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (error) toast.error('Gagal mengubah role');
    else {
      toast.success(`Role diubah → ${newRole.toUpperCase()}`);
      fetchData();
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || newUser.password.length < 6) {
      toast.error('Email valid dan password minimal 6 karakter diperlukan');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Membuat akun baru...');

    try {
      // Create a secondary client that does NOT persist session
      // This prevents the current admin from being logged out when creating a new user
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      const { data, error } = await tempClient.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (error) throw error;
      
      const newUserId = data.user?.id;
      if (newUserId) {
        // Coba insert profile manual jika trigger tidak jalan
        await supabase.from('profiles').insert([
          { id: newUserId, email: newUser.email, role: newUser.role }
        ]).select().single();
      }

      toast.success('Akun berhasil dibuat!', { id: toastId });
      setIsAddModalOpen(false);
      setNewUser({ email: '', password: '', role: 'crew' });
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (newPassword.password !== newPassword.confirm) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Mengubah password...');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.password });
      if (error) throw error;

      toast.success('Password berhasil diubah!', { id: toastId });
      setIsPasswordModalOpen(false);
      setNewPassword({ password: '', confirm: '' });
    } catch (error: any) {
      console.error(error);
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Akses & Login Activity">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">

        {/* ─── Header Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: 'Total Akun', value: accounts.length, color: 'text-balista-secondary', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: 'Admin', value: accounts.filter(a => a.role === 'admin').length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Crew', value: accounts.filter(a => a.role === 'crew').length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { label: 'Sesi Aktif', value: accounts.filter(a => a.isCurrentSession).length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          ].map(stat => (
            <div key={stat.label} className={`glass-card rounded-3xl p-5 border ${stat.border} flex flex-col items-center text-center`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-balista-primary/40 mb-2">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Tabel Login Activity ─── */}
        <div className="glass-card rounded-[28px] overflow-hidden border border-white/60 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Tabel Header */}
          <div className="px-6 py-5 border-b border-balista-primary/8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-lg text-balista-primary uppercase tracking-tight italic">
                🔐 Status Akun & Login Activity
              </h2>
              <p className="text-[10px] font-bold text-balista-primary/40 uppercase tracking-widest mt-0.5">
                Monitoring akses sistem real-time
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUserRole === 'admin' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-balista-secondary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest
                             hover:bg-[#b04a10] transition-all shadow-md shadow-balista-secondary/20 flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Tambah Akun
                </button>
              )}
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="glass px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-balista-primary/60
                           hover:bg-white/50 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  className={loading ? 'animate-spin' : ''}
                >
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-balista-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-balista-primary/30 uppercase tracking-widest">Memuat data akun...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-bold text-balista-primary/30 uppercase tracking-widest">Tidak ada akun ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 700 }}>
                <thead>
                  <tr className="bg-balista-primary/3 border-b border-balista-primary/8">
                    {['Akun / Email', 'Role', 'Login Terakhir', 'Device & Browser', 'Status Session', 'Aksi'].map(h => (
                      <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-balista-primary/40">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-balista-primary/5">
                  {accounts.map((acc) => {
                    const device = acc.currentDevice;
                    return (
                      <tr
                        key={acc.id}
                        className={`transition-all hover:bg-white/60 ${acc.isCurrentSession ? 'bg-green-50/40' : ''}`}
                      >
                        {/* Email */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0
                              ${acc.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                            >
                              {(acc.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-balista-primary lowercase truncate max-w-[180px]" title={acc.email}>
                                {acc.email}
                              </p>
                              {acc.isCurrentSession && (
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">
                                  ← Sesi Kamu
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest
                            ${acc.role === 'admin'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                            }`}
                          >
                            {acc.role === 'admin' ? '⬡ Admin' : '◆ Crew'}
                          </span>
                        </td>

                        {/* Login Terakhir */}
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-balista-primary/80">
                            {acc.isCurrentSession ? '🟢 Sekarang (Aktif)' : '—'}
                          </p>
                          {acc.isCurrentSession ? (
                            <p className="text-[9px] font-medium text-green-600/70 mt-0.5">
                              Login aktif di browser ini
                            </p>
                          ) : (
                            <p className="text-[9px] font-medium text-balista-primary/30 mt-0.5 italic">
                              Tidak tersedia
                            </p>
                          )}
                        </td>

                        {/* Device */}
                        <td className="px-6 py-5">
                          {acc.isCurrentSession && device ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-balista-primary/70">
                                <DeviceIcon isMobile={device.isMobile} />
                                <span className="text-[11px] font-bold">{device.browser}</span>
                              </div>
                              <span className="text-[9px] font-bold text-balista-primary/40 uppercase tracking-wide">
                                {device.os} {device.isMobile ? '(Mobile)' : '(Desktop)'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-balista-primary/25 italic">
                              Tidak terdeteksi
                            </span>
                          )}
                        </td>

                        {/* Status Session */}
                        <td className="px-6 py-5">
                          <SessionBadge isActive={acc.isCurrentSession} />
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {currentUserRole === 'admin' && acc.email !== 'tasya.officebalista@gmail.com' && (
                              <button
                                onClick={() => toggleRole(acc.id, acc.role)}
                                className="glass px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                                           text-balista-primary/60 hover:bg-balista-secondary hover:text-white
                                           transition-all duration-300 border border-white/40 whitespace-nowrap"
                              >
                                Ubah Role
                              </button>
                            )}
                            
                            {acc.isCurrentSession && (
                              <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="glass px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest
                                           text-balista-primary/60 hover:bg-balista-primary hover:text-white
                                           transition-all duration-300 border border-white/40 whitespace-nowrap flex items-center gap-1.5"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Ubah Password
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note */}
          <div className="px-6 py-4 border-t border-balista-primary/8 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(3,63,63,0.3)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[9px] font-bold text-balista-primary/30 uppercase tracking-widest">
              Info device hanya terlihat untuk akun yang sedang login di browser ini.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Modal Tambah Akun */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAddModalOpen(false)} />
          <div className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-[32px] shadow-2xl relative p-8 border border-white/40 animate-slide-up">
            <h2 className="text-xl font-black text-balista-primary uppercase tracking-tight italic mb-6">
              Tambah Akun Baru
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-balista-primary/60 mb-2">Email</label>
                <input
                  type="email" required
                  value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full glass-card border border-white/40 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-balista-secondary/40"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-balista-primary/60 mb-2">Password</label>
                <input
                  type="password" required minLength={6}
                  value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full glass-card border border-white/40 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-balista-secondary/40"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-balista-primary/60 mb-2">Role Akses</label>
                <select
                  value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full glass-card border border-white/40 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-balista-secondary/40"
                >
                  <option value="crew">Crew (Standar)</option>
                  <option value="admin">Admin (Penuh)</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}
                  className="flex-1 glass py-3 rounded-xl text-xs font-black uppercase tracking-widest text-balista-primary/60 hover:bg-white/50"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-balista-secondary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#b04a10] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsPasswordModalOpen(false)} />
          <div className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-[32px] shadow-2xl relative p-8 border border-white/40 animate-slide-up">
            <h2 className="text-xl font-black text-balista-primary uppercase tracking-tight italic mb-6">
              Ubah Password Anda
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-balista-primary/60 mb-2">Password Baru</label>
                <input
                  type="password" required minLength={6}
                  value={newPassword.password} onChange={e => setNewPassword({...newPassword, password: e.target.value})}
                  className="w-full glass-card border border-white/40 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-balista-secondary/40"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-balista-primary/60 mb-2">Konfirmasi Password Baru</label>
                <input
                  type="password" required minLength={6}
                  value={newPassword.confirm} onChange={e => setNewPassword({...newPassword, confirm: e.target.value})}
                  className="w-full glass-card border border-white/40 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-balista-secondary/40"
                  placeholder="Ketik ulang password baru"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setIsPasswordModalOpen(false)} disabled={isSubmitting}
                  className="flex-1 glass py-3 rounded-xl text-xs font-black uppercase tracking-widest text-balista-primary/60 hover:bg-white/50"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-balista-primary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#022f2f] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default CrewManagement;