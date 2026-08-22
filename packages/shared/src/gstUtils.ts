/**
 * Indian Goods & Services Tax (GST) Utilities for KhataGenie
 */

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Validates whether a given string is a structurally valid 15-character Indian GSTIN.
 */
export function validateGstin(gstin: string | null | undefined): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(clean)) return false;
  const stateCode = clean.substring(0, 2);
  return stateCode in GST_STATE_CODES;
}

/**
 * Extracts the 10-character Permanent Account Number (PAN) from a GSTIN.
 */
export function extractPanFromGstin(gstin: string | null | undefined): string | null {
  if (!gstin) return null;
  const clean = gstin.trim().toUpperCase();
  if (clean.length === 15) {
    const panCandidate = clean.substring(2, 12);
    if (PAN_REGEX.test(panCandidate)) {
      return panCandidate;
    }
  }
  return null;
}

/**
 * Gets the Indian State Name for a given GSTIN or 2-digit state code.
 */
export function getStateFromGstin(gstinOrStateCode: string | null | undefined): string | null {
  if (!gstinOrStateCode) return null;
  const clean = gstinOrStateCode.trim().toUpperCase();
  const code = clean.length >= 2 ? clean.substring(0, 2) : clean;
  return GST_STATE_CODES[code] || null;
}

export type TaxStructure = 'INTRA_STATE' | 'INTER_STATE' | 'UNKNOWN';

/**
 * Determines whether a transaction between supplier and buyer is Intra-State (CGST+SGST) or Inter-State (IGST).
 */
export function determineTaxStructure(
  supplierGstin: string | null | undefined,
  buyerGstin: string | null | undefined
): TaxStructure {
  if (!supplierGstin || !buyerGstin) return 'UNKNOWN';
  if (!validateGstin(supplierGstin) || !validateGstin(buyerGstin)) return 'UNKNOWN';
  
  const supplierState = supplierGstin.trim().substring(0, 2);
  const buyerState = buyerGstin.trim().substring(0, 2);

  return supplierState === buyerState ? 'INTRA_STATE' : 'INTER_STATE';
}
