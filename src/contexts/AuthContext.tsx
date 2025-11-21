import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const hasOptIn = localStorage.getItem('axis_user_optin') === '1';
    if (data.session?.user && hasOptIn) {
      setUserId(data.session.user.id);
      setIsAuthenticated(true);
      return;
    }

    // Se houver sessão antiga sem opt-in (ex: testes anteriores), força logout para pedir credenciais.
    if (data.session && !hasOptIn) {
      await supabase.auth.signOut();
      localStorage.removeItem('axis_user_optin');
    } else {
      setUserId(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    localStorage.setItem('axis_user_optin', '1');
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw error;
    }
    localStorage.setItem('axis_user_optin', '1');
  }, []);

  const logout = () => {
    supabase.auth.signOut();
    localStorage.removeItem('axis_user_optin');
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
