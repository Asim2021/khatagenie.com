import { create } from 'zustand';
import { AuthUser, FeatureFlagKey, TIER_FEATURE_DEFAULTS, SubscriptionTier } from '@khatagenie/types';

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  featureOverrides: Record<string, boolean>;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  isFeatureEnabled: (flag: FeatureFlagKey) => boolean;
  toggleFeatureOverride: (flag: FeatureFlagKey, enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  featureOverrides: {},
  isLoading: true,

  setAuth: (token: string, user: AuthUser) => {
    const overrides = user.featureOverrides || (user as any).features || {};
    set({
      token,
      user,
      featureOverrides: overrides,
      isLoading: false,
    });
  },

  clearAuth: () => {
    set({
      token: null,
      user: null,
      featureOverrides: {},
      isLoading: false,
    });
  },

  setUser: (user: AuthUser | null) => {
    if (!user) {
      set({ user: null });
      return;
    }
    const overrides = user.featureOverrides || (user as any).features || {};
    set((state) => ({
      user,
      featureOverrides: { ...state.featureOverrides, ...overrides },
    }));
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  isFeatureEnabled: (flag: FeatureFlagKey): boolean => {
    const { featureOverrides, user } = get();
    if (flag in featureOverrides) {
      return Boolean(featureOverrides[flag]);
    }
    const tier = (user?.subscriptionTier as SubscriptionTier) || 'free';
    const defaults = TIER_FEATURE_DEFAULTS[tier] || TIER_FEATURE_DEFAULTS.free;
    return Boolean(defaults[flag]);
  },

  toggleFeatureOverride: (flag: FeatureFlagKey, enabled: boolean) => {
    set((state) => ({
      featureOverrides: {
        ...state.featureOverrides,
        [flag]: enabled,
      },
    }));
  },
}));
