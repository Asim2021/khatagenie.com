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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        // Create mock initial admin session for seamless local preview
        const mockAdmin: AuthUser = {
          id: 'usr_admin_01',
          organizationId: 'org_bansal_ca',
          email: 'admin@khatagenie.com',
          fullName: 'CA Rajesh Bansal, FCA',
          role: 'CA_ADMIN' as any,
          subscriptionTier: 'pro',
          features: {
            ...TIER_FEATURE_DEFAULTS.pro,
            feature_bulk_approval: true,
          },
        };
        setUser(mockAdmin);
        setFeatureOverrides(mockAdmin.features);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetchApi<{ user: any }>('/auth/me');
        setUser(res.user);
        setFeatureOverrides(res.user.featureOverrides || {});
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
    setToken(newToken);
    setUser(newUser);
    setFeatureOverrides(newUser.features || {});
  };

  const logout = () => {
    localStorage.removeItem('kg_token');
    setToken(null);
    setUser(null);
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
    setFeatureOverrides((prev) => ({ ...prev, [flag]: enabled }));
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
