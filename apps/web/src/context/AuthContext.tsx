import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, FeatureFlagKey, TIER_FEATURE_DEFAULTS, SubscriptionTier } from '@khatagenie/types';
import { fetchApi } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isFeatureEnabled: (flag: FeatureFlagKey) => boolean;
  toggleFeatureOverride: (flag: FeatureFlagKey, enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('kg_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('kg_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>(() => {
    const savedOverrides = localStorage.getItem('kg_feature_overrides');
    if (savedOverrides) {
      try {
        return JSON.parse(savedOverrides);
      } catch {}
    }
    const savedUser = localStorage.getItem('kg_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return parsed.featureOverrides || parsed.features || {};
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetchApi<{ user: any }>('/auth/me');
        setUser(res.user);
        localStorage.setItem('kg_user', JSON.stringify(res.user));
        if (res.user.featureOverrides) {
          setFeatureOverrides((prev) => ({ ...res.user.featureOverrides, ...prev }));
        }
      } catch (err) {
        console.warn('Failed to restore session from API:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('kg_token', newToken);
    localStorage.setItem('kg_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    const overrides = newUser.featureOverrides || (newUser as any).features || {};
    setFeatureOverrides(overrides);
    localStorage.setItem('kg_feature_overrides', JSON.stringify(overrides));
  };

  const logout = () => {
    localStorage.removeItem('kg_token');
    localStorage.removeItem('kg_user');
    localStorage.removeItem('kg_feature_overrides');
    setToken(null);
    setUser(null);
    setFeatureOverrides({});
  };

  const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
    if (flag in featureOverrides) {
      return Boolean(featureOverrides[flag]);
    }
    const tier = (user?.subscriptionTier as SubscriptionTier) || 'free';
    const defaults = TIER_FEATURE_DEFAULTS[tier] || TIER_FEATURE_DEFAULTS.free;
    return Boolean(defaults[flag]);
  };

  const toggleFeatureOverride = (flag: FeatureFlagKey, enabled: boolean) => {
    setFeatureOverrides((prev) => {
      const next = { ...prev, [flag]: enabled };
      localStorage.setItem('kg_feature_overrides', JSON.stringify(next));
      return next;
    });
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
