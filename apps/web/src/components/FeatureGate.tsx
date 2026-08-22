import React from 'react';
import { FeatureFlagKey } from '@khatagenie/types';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

interface FeatureGateProps {
  flag: FeatureFlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Mandatory UI Feature Gate Component.
 * Renders children ONLY if the specified feature flag is enabled.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ flag, children, fallback = null }) => {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
