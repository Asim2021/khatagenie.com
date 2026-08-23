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
  description: z.string().optional().default('Line Item'),
  hsnCode: z.string().nullable().optional(),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.coerce.number().nullable().optional(),
  taxableAmount: z.coerce.number().optional().default(0),
  gstRate: z.coerce.number().optional().default(0), // e.g. 18 for 18%
  cgstAmount: z.coerce.number().nullable().optional().default(0),
  sgstAmount: z.coerce.number().nullable().optional().default(0),
  igstAmount: z.coerce.number().nullable().optional().default(0),
  totalAmount: z.coerce.number().optional().default(0),
}).passthrough();

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

/**
 * Strict JSON schema returned by Vision AI model
 */
export const InvoiceExtractionSchema = z.object({
  supplierName: z.string().nullable().optional(),
  supplierGstin: z.string().nullable().optional(),
  supplierAddress: z.string().nullable().optional(),
  buyerGstin: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  invoiceDate: z.string().nullable().optional(), // YYYY-MM-DD
  dueDate: z.string().nullable().optional(),
  invoiceType: z.nativeEnum(InvoiceType).default(InvoiceType.B2B_TAX_INVOICE).optional(),
  taxableAmount: z.coerce.number().nullable().optional(),
  cgstAmount: z.coerce.number().nullable().optional(),
  sgstAmount: z.coerce.number().nullable().optional(),
  igstAmount: z.coerce.number().nullable().optional(),
  cessAmount: z.coerce.number().nullable().optional(),
  roundOffAmount: z.coerce.number().nullable().optional(),
  totalAmount: z.coerce.number().nullable().optional(),
  isReverseCharge: z.boolean().default(false).optional(),
  lineItems: z.array(InvoiceItemSchema).default([]),
  confidenceScore: z.coerce.number().min(0).max(1).default(0.8),
  extractionNotes: z.string().nullable().optional(),
}).passthrough();

export type InvoiceExtractionResult = z.infer<typeof InvoiceExtractionSchema>;

export const InvoiceUpdateSchema = z.object({
  supplierName: z.string().optional(),
  supplierGstin: z.string().optional(),
  supplierAddress: z.string().optional(),
  buyerGstin: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  invoiceType: z.nativeEnum(InvoiceType).optional(),
  taxableAmount: z.coerce.number().optional(),
  cgstAmount: z.coerce.number().optional(),
  sgstAmount: z.coerce.number().optional(),
  igstAmount: z.coerce.number().optional(),
  cessAmount: z.coerce.number().optional(),
  roundOffAmount: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  isRcm: z.boolean().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: z.string().nullable().optional(),
  reviewNotes: z.string().optional(),
  lineItems: z.array(InvoiceItemSchema).optional(),
}).passthrough();

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

