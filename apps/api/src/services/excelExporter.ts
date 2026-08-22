import * as XLSX from 'xlsx';

export class ExcelExporter {
  /**
   * Generates a standard Indian GSTR-2 format Excel Purchase Register from invoice records.
   */
  public generatePurchaseRegisterExcel(invoices: any[]): Buffer {
    const rows = invoices.map((inv, index) => {
      return {
        'S.No': index + 1,
        'Client Name': inv.client?.businessName || 'Unassigned',
        'Client GSTIN': inv.client?.gstin || 'N/A',
        'Supplier Name': inv.supplierName || 'Unknown Supplier',
        'Supplier GSTIN': inv.supplierGstin || 'N/A',
        'Supplier PAN': inv.supplierPan || 'N/A',
        'Invoice Number': inv.invoiceNumber || 'N/A',
        'Invoice Date': inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : 'N/A',
        'Invoice Type': inv.invoiceType || 'B2B_TAX_INVOICE',
        'Taxable Value (₹)': Number(inv.taxableAmount || 0),
        'CGST (₹)': Number(inv.cgstAmount || 0),
        'SGST (₹)': Number(inv.sgstAmount || 0),
        'IGST (₹)': Number(inv.igstAmount || 0),
        'Cess (₹)': Number(inv.cessAmount || 0),
        'Round Off (₹)': Number(inv.roundOffAmount || 0),
        'Total Amount (₹)': Number(inv.totalAmount || 0),
        'RCM': inv.isRcm ? 'YES' : 'NO',
        'Math Valid': inv.isMathValid ? 'BALANCED' : 'MISMATCH',
        'Review Status': inv.status,
        'Sender WhatsApp': `+${inv.senderPhone}`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Client Name
      { wch: 18 }, // Client GSTIN
      { wch: 28 }, // Supplier Name
      { wch: 18 }, // Supplier GSTIN
      { wch: 14 }, // Supplier PAN
      { wch: 16 }, // Invoice Number
      { wch: 14 }, // Invoice Date
      { wch: 18 }, // Invoice Type
      { wch: 16 }, // Taxable Value
      { wch: 12 }, // CGST
      { wch: 12 }, // SGST
      { wch: 12 }, // IGST
      { wch: 10 }, // Cess
      { wch: 12 }, // Round Off
      { wch: 16 }, // Total Amount
      { wch: 8 },  // RCM
      { wch: 12 }, // Math Valid
      { wch: 14 }, // Review Status
      { wch: 18 }, // Sender WhatsApp
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GST Purchase Register');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const excelExporter = new ExcelExporter();
