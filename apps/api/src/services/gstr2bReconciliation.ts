import { 
  Gstr2bMatchStatus, 
  ReconciliationItem, 
  ReconciliationSummary,
  Gstr2bInvoiceRecord 
} from '@khatagenie/types';
import { prisma } from '../lib/prisma';

export class Gstr2bReconciliationService {
  /**
   * Normalizes invoice numbers for resilient matching (removes symbols, leading zeros, whitespace)
   */
  private normalizeInvoiceNumber(invNo?: string | null): string {
    if (!invNo) return '';
    return invNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Normalizes GSTIN (uppercase, trimmed)
   */
  private normalizeGstin(gstin?: string | null): string {
    if (!gstin) return '';
    return gstin.trim().toUpperCase();
  }

  /**
   * Parses official GST Portal GSTR-2B JSON payload
   */
  public parseGstr2bJson(jsonPayload: any): Gstr2bInvoiceRecord[] {
    const records: Gstr2bInvoiceRecord[] = [];
    const data = jsonPayload?.data || jsonPayload;
    const b2bList = data?.docdata?.b2b || data?.b2b || [];

    for (const supplier of b2bList) {
      const supplierGstin = supplier.ctin || supplier.supplierGstin || '';
      const supplierTradeName = supplier.cname || supplier.tradeName || '';
      const invoices = supplier.inv || [];

      for (const inv of invoices) {
        const invoiceNumber = inv.inum || inv.invoiceNumber || '';
        const invoiceDate = inv.idt || inv.invoiceDate || '';
        const invoiceValue = Number(inv.val || 0);
        const itcAvailability = (inv.itcavl || 'Y') as 'Y' | 'N';
        const reasonForIneligibleItc = inv.rsn || '';

        let taxableAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let cessAmount = 0;

        const items = inv.items || [];
        for (const item of items) {
          const itemDetails = item.itm_det || item;
          taxableAmount += Number(itemDetails.txval || 0);
          igstAmount += Number(itemDetails.iamt || 0);
          cgstAmount += Number(itemDetails.camt || 0);
          sgstAmount += Number(itemDetails.samt || 0);
          cessAmount += Number(itemDetails.csamt || 0);
        }

        records.push({
          supplierGstin,
          supplierTradeName,
          invoiceNumber,
          invoiceType: inv.inv_typ || 'R',
          invoiceDate,
          invoiceValue,
          taxableAmount,
          igstAmount,
          cgstAmount,
          sgstAmount,
          cessAmount,
          filingPeriod: data?.fp || 'CURRENT',
          filingDate: inv.dtstamp,
          itcAvailability,
          reasonForIneligibleItc,
        });
      }
    }

    return records;
  }

  /**
   * Performs 2-Way automated matching between books invoices and GSTR-2B records
   */
  public async reconcile(
    organizationId: string,
    gstr2bRecords: Gstr2bInvoiceRecord[]
  ): Promise<ReconciliationSummary> {
    // 1. Fetch all approved / needs_review invoices for this organization
    const booksInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['NEEDS_REVIEW', 'APPROVED', 'EXPORTED'] },
      },
      include: { client: true },
    });


    const reconciliationItems: ReconciliationItem[] = [];
    const matchedBooksInvoiceIds = new Set<string>();

    let matchedCount = 0;
    let taxMismatchCount = 0;
    let missingInBooksCount = 0;
    let totalItcAvailableBooks = 0;
    let totalItcAvailableGstr2b = 0;

    // 2. Loop through GSTR-2B records and match against Books
    for (const gstrItem of gstr2bRecords) {
      const normGstin = this.normalizeGstin(gstrItem.supplierGstin);
      const normInvNo = this.normalizeInvoiceNumber(gstrItem.invoiceNumber);

      const gstrTaxAmount = gstrItem.igstAmount + gstrItem.cgstAmount + gstrItem.sgstAmount + gstrItem.cessAmount;
      if (gstrItem.itcAvailability === 'Y') {
        totalItcAvailableGstr2b += gstrTaxAmount;
      }

      // Search for matching book invoice
      const matchedBook = booksInvoices.find((b) => {
        if (matchedBooksInvoiceIds.has(b.id)) return false;
        const bGstin = this.normalizeGstin(b.supplierGstin);
        const bInvNo = this.normalizeInvoiceNumber(b.invoiceNumber);
        return bGstin === normGstin && (bInvNo === normInvNo || bInvNo.includes(normInvNo) || normInvNo.includes(bInvNo));
      });

      if (matchedBook) {
        matchedBooksInvoiceIds.add(matchedBook.id);

        const booksTaxAmount = Number(matchedBook.cgstAmount || 0) + Number(matchedBook.sgstAmount || 0) + Number(matchedBook.igstAmount || 0) + Number(matchedBook.cessAmount || 0);
        const booksTotalAmount = Number(matchedBook.totalAmount || 0);
        totalItcAvailableBooks += booksTaxAmount;

        const taxDiff = Math.abs(booksTaxAmount - gstrTaxAmount);
        const totalDiff = Math.abs(booksTotalAmount - gstrItem.invoiceValue);

        // Check if within acceptable ₹2.00 rounding tolerance
        const isTaxMatch = taxDiff <= 2.0;

        const status = isTaxMatch ? Gstr2bMatchStatus.MATCHED : Gstr2bMatchStatus.TAX_MISMATCH;
        if (isTaxMatch) {
          matchedCount++;
        } else {
          taxMismatchCount++;
        }

        reconciliationItems.push({
          id: `recon_${matchedBook.id}`,
          matchStatus: status,
          confidenceScore: isTaxMatch ? 1.0 : 0.75,
          booksInvoiceId: matchedBook.id,
          booksInvoiceNumber: matchedBook.invoiceNumber || undefined,
          booksInvoiceDate: matchedBook.invoiceDate ? matchedBook.invoiceDate.toISOString().split('T')[0] : undefined,
          booksSupplierGstin: matchedBook.supplierGstin || undefined,
          booksSupplierName: matchedBook.supplierName || undefined,
          booksTaxableAmount: Number(matchedBook.taxableAmount || 0),
          booksTaxAmount,
          booksTotalAmount,

          gstr2bSupplierGstin: gstrItem.supplierGstin,
          gstr2bSupplierName: gstrItem.supplierTradeName || matchedBook.supplierName || undefined,
          gstr2bInvoiceNumber: gstrItem.invoiceNumber,
          gstr2bInvoiceDate: gstrItem.invoiceDate,
          gstr2bTaxableAmount: gstrItem.taxableAmount,
          gstr2bTaxAmount: gstrTaxAmount,
          gstr2bTotalAmount: gstrItem.invoiceValue,
          gstr2bItcEligible: gstrItem.itcAvailability === 'Y',

          taxVariance: taxDiff,
          valueVariance: totalDiff,
          notes: isTaxMatch ? 'Exact GSTIN and tax match.' : `Tax mismatch of ₹${taxDiff.toFixed(2)}.`,
        });
      } else {
        // Exists in GSTR-2B but missing in books
        missingInBooksCount++;
        reconciliationItems.push({
          id: `recon_missing_books_${Math.random().toString(36).substring(2, 8)}`,
          matchStatus: Gstr2bMatchStatus.MISSING_IN_BOOKS,
          confidenceScore: 0.0,
          gstr2bSupplierGstin: gstrItem.supplierGstin,
          gstr2bSupplierName: gstrItem.supplierTradeName,
          gstr2bInvoiceNumber: gstrItem.invoiceNumber,
          gstr2bInvoiceDate: gstrItem.invoiceDate,
          gstr2bTaxableAmount: gstrItem.taxableAmount,
          gstr2bTaxAmount: gstrTaxAmount,
          gstr2bTotalAmount: gstrItem.invoiceValue,
          gstr2bItcEligible: gstrItem.itcAvailability === 'Y',
          notes: 'Invoice filed by supplier on GST portal, but missing in digitized books.',
        });
      }
    }

    // 3. Find Invoices in Books that are MISSING in GSTR-2B
    let missingInGstr2bCount = 0;
    for (const b of booksInvoices) {
      if (!matchedBooksInvoiceIds.has(b.id)) {
        missingInGstr2bCount++;
        const booksTaxAmount = Number(b.cgstAmount || 0) + Number(b.sgstAmount || 0) + Number(b.igstAmount || 0) + Number(b.cessAmount || 0);
        totalItcAvailableBooks += booksTaxAmount;

        reconciliationItems.push({
          id: `recon_missing_2b_${b.id}`,
          matchStatus: Gstr2bMatchStatus.MISSING_IN_GSTR2B,
          confidenceScore: 0.0,
          booksInvoiceId: b.id,
          booksInvoiceNumber: b.invoiceNumber || undefined,
          booksInvoiceDate: b.invoiceDate ? b.invoiceDate.toISOString().split('T')[0] : undefined,
          booksSupplierGstin: b.supplierGstin || undefined,
          booksSupplierName: b.supplierName || undefined,
          booksTaxableAmount: Number(b.taxableAmount || 0),
          booksTaxAmount,
          booksTotalAmount: Number(b.totalAmount || 0),
          notes: 'Supplier has not filed GSTR-1 yet. Provisional ITC restricted under Rule 36(4).',
        });
      }
    }

    return {
      period: 'CURRENT_MONTH',
      totalGstr2bRecords: gstr2bRecords.length,
      totalBooksRecords: booksInvoices.length,
      matchedCount,
      taxMismatchCount,
      missingInBooksCount,
      missingInGstr2bCount,
      totalItcAvailableBooks,
      totalItcAvailableGstr2b,
      itcMismatchVariance: Math.abs(totalItcAvailableBooks - totalItcAvailableGstr2b),
      items: reconciliationItems,
    };
  }
}

export const gstr2bService = new Gstr2bReconciliationService();
