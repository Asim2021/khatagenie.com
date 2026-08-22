import { z } from 'zod';

export enum Gstr2bMatchStatus {
  MATCHED = 'MATCHED',
  TAX_MISMATCH = 'TAX_MISMATCH',
  MISSING_IN_BOOKS = 'MISSING_IN_BOOKS',
  MISSING_IN_GSTR2B = 'MISSING_IN_GSTR2B',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
}

export interface Gstr2bInvoiceRecord {
  supplierGstin: string;
  supplierTradeName?: string;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceValue: number;
  taxableAmount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
  filingPeriod: string; // MMYYYY e.g. "082026"
  filingDate?: string;
  itcAvailability: 'Y' | 'N';
  reasonForIneligibleItc?: string;
}

export interface ReconciliationItem {
  id: string;
  matchStatus: Gstr2bMatchStatus;
  confidenceScore: number;
  booksInvoiceId?: string;
  booksInvoiceNumber?: string;
  booksInvoiceDate?: string;
  booksSupplierGstin?: string;
  booksSupplierName?: string;
  booksTaxableAmount?: number;
  booksTaxAmount?: number;
  booksTotalAmount?: number;

  gstr2bSupplierGstin?: string;
  gstr2bSupplierName?: string;
  gstr2bInvoiceNumber?: string;
  gstr2bInvoiceDate?: string;
  gstr2bTaxableAmount?: number;
  gstr2bTaxAmount?: number;
  gstr2bTotalAmount?: number;
  gstr2bItcEligible?: boolean;

  taxVariance?: number;
  valueVariance?: number;
  notes?: string;
}

export interface ReconciliationSummary {
  period: string;
  totalGstr2bRecords: number;
  totalBooksRecords: number;
  matchedCount: number;
  taxMismatchCount: number;
  missingInBooksCount: number;
  missingInGstr2bCount: number;
  totalItcAvailableBooks: number;
  totalItcAvailableGstr2b: number;
  itcMismatchVariance: number;
  items: ReconciliationItem[];
}
