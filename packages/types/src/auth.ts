import { z } from 'zod';
import { FeatureFlagKey } from './featureFlags';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  CA_ADMIN = 'CA_ADMIN',
  CA_STAFF = 'CA_STAFF',
}

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface AuthUser {
  id: string;
  organizationId: string;
  organizationName?: string;
  email: string;
  fullName: string;
  role: UserRole;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  features: Record<FeatureFlagKey, boolean>;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}
