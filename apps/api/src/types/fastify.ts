import { SubscriptionTier } from '@khatagenie/types';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
  type?: string;
  rememberMe?: boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    organization?: {
      id: string;
      subscriptionTier: SubscriptionTier;
      featureOverrides: Record<string, boolean> | null;
    };
  }
}
