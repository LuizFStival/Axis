import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = storage.getUser();
    if (storedUser) {
      setUserId(storedUser);
      setIsAuthenticated(true);
    } else {
      const newUserId = `user-${Date.now()}`;
      storage.setUser(newUserId);
      setUserId(newUserId);
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    const newUserId = `user-${Date.now()}`;
    storage.setUser(newUserId);
    setUserId(newUserId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    storage.clearUser();
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
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
