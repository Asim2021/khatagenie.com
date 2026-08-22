import { FeatureFlagKey } from '@khatagenie/types';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to evaluate whether a given feature flag is enabled for current tenant.
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  const { isFeatureEnabled } = useAuth();
  return isFeatureEnabled(flag);
}
