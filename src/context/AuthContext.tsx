import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    businessType?: string;
    currency?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: () => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const saved = localStorage.getItem('hisobchi_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('hisobchi_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Kirishda xatolik yuz berdi' };
      }
      setUser(data.user);
      localStorage.setItem('hisobchi_user', JSON.stringify(data.user));
      if (data.business) {
        localStorage.setItem('hisobchi_active_business', JSON.stringify(data.business));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server bilan bog‘lanib bo‘lmadi' };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Ro‘yxatdan o‘tishda xatolik' };
      }
      setUser(data.user);
      localStorage.setItem('hisobchi_user', JSON.stringify(data.user));
      if (data.business) {
        localStorage.setItem('hisobchi_active_business', JSON.stringify(data.business));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server bilan bog‘lanib bo‘lmadi' };
    }
  };

  const quickDemoLogin = async () => {
    await login('admin@hisobchi.uz', 'admin');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hisobchi_user');
    localStorage.removeItem('hisobchi_active_business');
  };

  const updateUser = (updated: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...updated };
    setUser(next);
    localStorage.setItem('hisobchi_user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
