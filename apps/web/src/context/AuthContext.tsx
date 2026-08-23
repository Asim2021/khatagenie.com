import React, { createContext, useContext, useEffect } from 'react';
import { AuthUser, FeatureFlagKey } from '@khatagenie/types';
import { useAuthStore } from '../store/authStore';
import { fetchApi } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  isFeatureEnabled: (flag: FeatureFlagKey) => boolean;
  toggleFeatureOverride: (flag: FeatureFlagKey, enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 14 minutes in milliseconds (proactive rotation 1 minute before the 15-min JWT expires)
const PROACTIVE_REFRESH_INTERVAL_MS = 14 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isFeatureEnabled = useAuthStore((state) => state.isFeatureEnabled);
  const toggleFeatureOverride = useAuthStore((state) => state.toggleFeatureOverride);

  // 1. Silent session boot on app launch / browser refresh via httpOnly refresh cookie
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetchApi<{ token: string; user: AuthUser }>('/auth/refresh', {
          method: 'POST',
        });
        if (res.token && res.user) {
          setAuth(res.token, res.user);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }

    initSession();
  }, [setAuth, clearAuth]);

  // 2. Proactive background token rotation timer while active
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchApi<{ token: string; user: AuthUser }>('/auth/refresh', {
          method: 'POST',
        });
        if (res.token && res.user) {
          setAuth(res.token, res.user);
        }
      } catch (err) {
        console.warn('Proactive background token rotation failed; reactive 401 interceptor will handle next request.', err);
      }
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, setAuth]);

  const login = (newToken: string, newUser: AuthUser) => {
    setAuth(newToken, newUser);
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {}
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isFeatureEnabled,
        toggleFeatureOverride,
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
