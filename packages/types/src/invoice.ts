import { z } from 'zod';

export enum InvoiceStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPORTED = 'EXPORTED',
}

export enum InvoiceType {
  B2B_TAX_INVOICE = 'B2B_TAX_INVOICE',
  B2C_RETAIL_INVOICE = 'B2C_RETAIL_INVOICE',
  BILL_OF_SUPPLY = 'BILL_OF_SUPPLY',
  EXPENSE_VOUCHER = 'EXPENSE_VOUCHER',
  DEBIT_NOTE = 'DEBIT_NOTE',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  hsnCode: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  taxableAmount: z.number(),
  gstRate: z.number(), // e.g. 18 for 18%
  cgstAmount: z.number().nullable().optional(),
  sgstAmount: z.number().nullable().optional(),
  igstAmount: z.number().nullable().optional(),
  totalAmount: z.number(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

/**
 * Strict JSON schema returned by Vision AI model
 */
export const InvoiceExtractionSchema = z.object({
  supplierName: z.string().nullable(),
  supplierGstin: z.string().nullable(),
  supplierAddress: z.string().nullable(),
  buyerGstin: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  invoiceDate: z.string().nullable(), // YYYY-MM-DD
  dueDate: z.string().nullable().optional(),
  invoiceType: z.nativeEnum(InvoiceType).default(InvoiceType.B2B_TAX_INVOICE),
  taxableAmount: z.number().nullable(),
  cgstAmount: z.number().nullable(),
  sgstAmount: z.number().nullable(),
  igstAmount: z.number().nullable(),
  cessAmount: z.number().nullable().optional(),
  roundOffAmount: z.number().nullable().optional(),
  totalAmount: z.number().nullable(),
  isReverseCharge: z.boolean().default(false),
  lineItems: z.array(InvoiceItemSchema).default([]),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  extractionNotes: z.string().nullable().optional(),
});

export type InvoiceExtractionResult = z.infer<typeof InvoiceExtractionSchema>;

export const InvoiceUpdateSchema = z.object({
  supplierName: z.string().optional(),
  supplierGstin: z.string().optional(),
  supplierAddress: z.string().optional(),
  buyerGstin: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  invoiceType: z.nativeEnum(InvoiceType).optional(),
  taxableAmount: z.number().optional(),
  cgstAmount: z.number().optional(),
  sgstAmount: z.number().optional(),
  igstAmount: z.number().optional(),
  cessAmount: z.number().optional(),
  roundOffAmount: z.number().optional(),
  totalAmount: z.number().optional(),
  isRcm: z.boolean().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: z.string().nullable().optional(),
  reviewNotes: z.string().optional(),
  lineItems: z.array(InvoiceItemSchema).optional(),
});

export type InvoiceUpdatePayload = z.infer<typeof InvoiceUpdateSchema>;

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  clientId: string | null;
  senderPhone: string;
  whatsappMessageId: string | null;
  fileUrl: string;
  fileMimeType: string;
  fileSizeBytes: number;
  status: InvoiceStatus;
  rawAiResponse: any;
  confidenceScore: number | null;
  errorMessage: string | null;
  invoiceType: InvoiceType;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplierName: string | null;
  supplierGstin: string | null;
  supplierPan: string | null;
  supplierAddress: string | null;
  buyerGstin: string | null;
  taxableAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  igstAmount: number | null;
  cessAmount: number | null;
  roundOffAmount: number | null;
  totalAmount: number | null;
  isRcm: boolean;
  isMathValid: boolean;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  exportedAt: string | null;
  tallyVoucherId: string | null;
  pageCount?: number;
  pageUrls?: string[];
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceItem[];
}

