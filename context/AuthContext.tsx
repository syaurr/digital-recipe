import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI BYPASS (JALUR KHUSUS) ---
  // Kita tidak lagi meminta data ke database, tapi langsung buat data palsu
  // supaya kamu BISA MASUK dulu.
  const fetchProfile = async (userId: string) => {
    console.log("[BYPASS] Mengaktifkan Jalur VIP Admin...");
    
    // Kembalikan data profil ADMIN secara paksa
    return {
      id: userId,
      email: "urfahtasya@gmail.com", // Email kamu
      role: 'admin',                 // JABATAN ADMIN
      created_at: new Date().toISOString()
    } as Profile;
  };
  // -------------------------------------

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
        }

        if (currentSession?.user && mounted) {
          // Panggil fungsi Bypass di atas
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted) setProfile(userProfile);
        }
      } catch (error) {
        console.error('Gagal initAuth:', error);
      } finally {
        if (mounted) {
            setLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
                const userProfile = await fetchProfile(newSession.user.id);
                if (mounted) setProfile(userProfile);
            }
        } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        window.location.href = '/login'; 
    } catch (e) {
        console.error("Error sign out", e);
        window.location.href = '/login';
    }
  };

  const value = { user, session, profile, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};