import { FastifyRequest, FastifyReply } from 'fastify';
import { FeatureFlagKey, TIER_FEATURE_DEFAULTS, SubscriptionTier } from '@khatagenie/types';
import { prisma } from '../lib/prisma';
import type { AuthenticatedUser } from '../types/fastify';

/**
 * Helper to check if a feature flag is enabled for an organization.
 */
export async function isFeatureEnabledForOrg(
  organizationId: string,
  flagKey: FeatureFlagKey
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionTier: true, featureOverrides: true },
  });

  if (!org) return false;

  const tier = (org.subscriptionTier as SubscriptionTier) || 'free';
  const overrides = (org.featureOverrides as Record<string, boolean>) || {};

  // Check explicit override first
  if (flagKey in overrides) {
    return Boolean(overrides[flagKey]);
  }

  // Fallback to tier default
  const tierDefaults = TIER_FEATURE_DEFAULTS[tier] || TIER_FEATURE_DEFAULTS.free;
  return Boolean(tierDefaults[flagKey]);
}

/**
 * Mandatory Feature Guard Pre-Handler Middleware.
 * Rejects requests with HTTP 403 Forbidden if feature flag evaluates to false.
 */
export function requireFeature(flagKey: FeatureFlagKey) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user || !user.organizationId) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required before checking feature access.',
      });
    }

    const enabled = await isFeatureEnabledForOrg(user.organizationId, flagKey);

    if (!enabled) {
      return reply.status(403).send({
        error: 'FEATURE_DISABLED',
        message: `Feature '${flagKey}' is disabled for your subscription tier or organization.`,
        feature: flagKey,
      });
    }
  };
}
