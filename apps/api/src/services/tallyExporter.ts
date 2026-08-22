import { create } from 'xmlbuilder2';

function formatTallyDate(dateVal?: string | Date | null): string {
  const d = dateVal ? new Date(dateVal) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export const tallyExporter = {
  /**
   * Generates a Tally Prime compatible XML import string for a collection of approved invoices.
   */
  generatePurchaseVouchersXml(invoices: any[], companyName = 'KhataGenie Client'): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('ENVELOPE');

    // Header
    root.ele('HEADER').ele('TALLYREQUEST').txt('Import Data');

    // Body
    const body = root.ele('BODY');
    const importData = body.ele('IMPORTDATA');

    // Request Description
    const reqDesc = importData.ele('REQUESTDESC');
    reqDesc.ele('REPORTNAME').txt('Vouchers');
    const staticVars = reqDesc.ele('STATICVARIABLES');
    staticVars.ele('SVCURRENTCOMPANY').txt(companyName);

    // Request Data
    const reqData = importData.ele('REQUESTDATA');

    for (const inv of invoices) {
      const tallyMsg = reqData.ele('TALLYMESSAGE', { 'xmlns:UDF': 'TallyUDF' });
      const voucher = tallyMsg.ele('VOUCHER', {
        VCHTYPE: 'Purchase',
        ACTION: 'Create',
        OBJVIEW: 'Accounting Voucher View',
      });

      const tallyDate = formatTallyDate(inv.invoiceDate);
      const invNumber = inv.invoiceNumber || `KG-${inv.id.slice(0, 8)}`;
      const supplierName = inv.supplierName || 'Cash Supplier';
      const totalAmount = Number(inv.totalAmount || 0);
      const taxableAmount = Number(inv.taxableAmount || 0);
      const cgst = Number(inv.cgstAmount || 0);
      const sgst = Number(inv.sgstAmount || 0);
      const igst = Number(inv.igstAmount || 0);

      voucher.ele('DATE').txt(tallyDate);
      voucher.ele('VOUCHERTYPENAME').txt('Purchase');
      voucher.ele('REFERENCE').txt(invNumber);
      voucher.ele('VOUCHERNUMBER').txt(invNumber);
      voucher.ele('PARTYLEDGERNAME').txt(supplierName);
      voucher.ele('PERSISTEDVIEW').txt('Accounting Voucher View');
      voucher.ele('NARRATION').txt(`Imported via KhataGenie. WhatsApp from +${inv.senderPhone}. Bill #${invNumber}`);

      // 1. Credit Party Ledger (Supplier) with full Total Amount
      const supplierEntry = voucher.ele('ALLLEDGERENTRIES.LIST');
      supplierEntry.ele('LEDGERNAME').txt(supplierName);
      supplierEntry.ele('ISDEEMEDPOSITIVE').txt('No');
      supplierEntry.ele('AMOUNT').txt(totalAmount.toFixed(2));

      // 2. Debit Purchase Account (Taxable Value)
      const purchaseEntry = voucher.ele('ALLLEDGERENTRIES.LIST');
      purchaseEntry.ele('LEDGERNAME').txt(inv.client?.tallyLedgerName || 'GST Purchase Account');
      purchaseEntry.ele('ISDEEMEDPOSITIVE').txt('Yes');
      purchaseEntry.ele('AMOUNT').txt((-taxableAmount).toFixed(2));

      // 3. Debit CGST Input Ledger
      if (cgst > 0) {
        const cgstEntry = voucher.ele('ALLLEDGERENTRIES.LIST');
        cgstEntry.ele('LEDGERNAME').txt('Input CGST');
        cgstEntry.ele('ISDEEMEDPOSITIVE').txt('Yes');
        cgstEntry.ele('AMOUNT').txt((-cgst).toFixed(2));
      }

      // 4. Debit SGST Input Ledger
      if (sgst > 0) {
        const sgstEntry = voucher.ele('ALLLEDGERENTRIES.LIST');
        sgstEntry.ele('LEDGERNAME').txt('Input SGST');
        sgstEntry.ele('ISDEEMEDPOSITIVE').txt('Yes');
        sgstEntry.ele('AMOUNT').txt((-sgst).toFixed(2));
      }

      // 5. Debit IGST Input Ledger
      if (igst > 0) {
        const igstEntry = voucher.ele('ALLLEDGERENTRIES.LIST');
        igstEntry.ele('LEDGERNAME').txt('Input IGST');
        igstEntry.ele('ISDEEMEDPOSITIVE').txt('Yes');
        igstEntry.ele('AMOUNT').txt((-igst).toFixed(2));
      }
    }

    return root.end({ prettyPrint: true });
  },
};

