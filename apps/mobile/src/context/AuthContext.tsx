import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../../utils/storage';
import { apiFetch, type GrogonUser } from '../lib/api';

const TOKEN_KEY = 'grogon:auth:token';
const USER_KEY = 'grogon:auth:user';

type AuthContextValue = {
  booted: boolean;
  token: string | null;
  user: GrogonUser | null;
  isSeller: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    shopLocation?: string;
    accountType: 'buyer' | 'seller';
    password: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string | null, user: GrogonUser | null) {
  if (token) await storage.setItem(TOKEN_KEY, token);
  else await storage.removeItem(TOKEN_KEY);
  if (user) await storage.setItem(USER_KEY, JSON.stringify(user));
  else await storage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<GrogonUser | null>(null);

  useEffect(() => {
    (async () => {
      const savedToken = await storage.getItem(TOKEN_KEY);
      const savedUser = await storage.getItem(USER_KEY);
      setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser) as GrogonUser);
      setBooted(true);
    })();
  }, []);

  const applySession = useCallback(async (nextToken: string | null, nextUser: GrogonUser | null) => {
    setToken(nextToken);
    setUser(nextUser);
    await persistSession(nextToken, nextUser);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const payload = await apiFetch<{ user: GrogonUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await applySession(payload.token, payload.user);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      shopLocation?: string;
      accountType: 'buyer' | 'seller';
      password: string;
    }) => {
      const response = await apiFetch<{ user: GrogonUser; token: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await applySession(response.token, response.user);
    },
    [applySession],
  );

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const response = await apiFetch<{ user: GrogonUser }>('/api/auth/me', { token });
    setUser(response.user);
    await storage.setItem(USER_KEY, JSON.stringify(response.user));
  }, [token]);

  const signOut = useCallback(async () => {
    if (token) {
      await apiFetch('/api/auth/logout', { method: 'POST', token }).catch(() => undefined);
    }
    await applySession(null, null);
  }, [applySession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      booted,
      token,
      user,
      isSeller: user?.role === 'seller',
      signIn,
      signUp,
      refreshMe,
      signOut,
    }),
    [booted, refreshMe, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
