import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { IUser, AuthState } from '../types';
import { getMe } from '../api/auth';

interface AuthContextValue extends AuthState {
  setToken: (token: string, userId: number, role: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('raddigo_admin_token'),
    user: (() => {
      try {
        const raw = localStorage.getItem('raddigo_admin_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })(),
    isLoading: false,
  });

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('raddigo_admin_token')) return;
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const user = await getMe();
      localStorage.setItem('raddigo_admin_user', JSON.stringify(user));
      setState((s) => ({ ...s, user, isLoading: false }));
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const setToken = useCallback((token: string, _userId: number, _role: string) => {
    localStorage.setItem('raddigo_admin_token', token);
    setState((s) => ({ ...s, token }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('raddigo_admin_token');
    localStorage.removeItem('raddigo_admin_user');
    setState({ token: null, user: null, isLoading: false });
  }, []);

  useEffect(() => {
    if (state.token && !state.user) {
      refreshUser();
    }
  }, [state.token, state.user, refreshUser]);

  return (
    <AuthContext.Provider value={{ ...state, setToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
