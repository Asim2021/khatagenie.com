import { z } from 'zod';

export const ClientSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  businessName: z.string().min(1, 'Business name is required'),
  tradeName: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  whatsappPhone: z.string().min(10, 'Valid WhatsApp phone required'),
  tallyLedgerName: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type Client = z.infer<typeof ClientSchema>;

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Firm name is required'),
  firmGstin: z.string().nullable().optional(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string().nullable().optional(),
  subscriptionTier: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export type Organization = z.infer<typeof OrganizationSchema>;
