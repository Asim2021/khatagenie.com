import Decimal from 'decimal.js';

export interface MathVerificationResult {
  isValid: boolean;
  calculatedTotal: number;
  expectedTotal: number;
  delta: number;
  errorMessage: string | null;
}

/**
 * Mathematically verifies an invoice's financial breakdown with decimal precision.
 * Formula: Taxable + CGST + SGST + IGST + Cess + RoundOff = Grand Total
 * Tolerates rounding delta <= ₹1.00.
 */
export function verifyInvoiceMath(params: {
  taxableAmount?: number | null;
  cgstAmount?: number | null;
  sgstAmount?: number | null;
  igstAmount?: number | null;
  cessAmount?: number | null;
  roundOffAmount?: number | null;
  totalAmount?: number | null;
  tolerance?: number;
}): MathVerificationResult {
  const tolerance = new Decimal(params.tolerance ?? 1.0);
  const taxable = new Decimal(params.taxableAmount || 0);
  const cgst = new Decimal(params.cgstAmount || 0);
  const sgst = new Decimal(params.sgstAmount || 0);
  const igst = new Decimal(params.igstAmount || 0);
  const cess = new Decimal(params.cessAmount || 0);
  const roundOff = new Decimal(params.roundOffAmount || 0);
  const total = new Decimal(params.totalAmount || 0);

  // Calculated sum
  const calculatedSum = taxable
    .plus(cgst)
    .plus(sgst)
    .plus(igst)
    .plus(cess)
    .plus(roundOff);

  const delta = calculatedSum.minus(total).abs();
  const isValid = delta.lessThanOrEqualTo(tolerance);

  let errorMessage: string | null = null;
  if (!isValid && total.greaterThan(0)) {
    errorMessage = `Math mismatch: Taxable (₹${taxable}) + Taxes (₹${cgst.plus(sgst).plus(igst).plus(cess)}) = ₹${calculatedSum.toFixed(2)}, but Total is ₹${total.toFixed(2)} (Delta: ₹${delta.toFixed(2)})`;
  }

  return {
    isValid,
    calculatedTotal: calculatedSum.toNumber(),
    expectedTotal: total.toNumber(),
    delta: delta.toNumber(),
    errorMessage,
  };
}

/**
 * Calculates standard CGST and SGST splits from an intra-state GST rate.
 * Example: 18% rate on ₹1000 taxable -> CGST ₹90 (9%), SGST ₹90 (9%)
 */
export function calculateIntraStateTaxes(taxableAmount: number, gstRatePercent: number) {
  const taxable = new Decimal(taxableAmount);
  const halfRate = new Decimal(gstRatePercent).dividedBy(2).dividedBy(100);
  const taxPerHead = taxable.times(halfRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    cgstAmount: taxPerHead.toNumber(),
    sgstAmount: taxPerHead.toNumber(),
    totalTax: taxPerHead.times(2).toNumber(),
  };
}

/**
 * Calculates IGST from an inter-state GST rate.
 * Example: 18% rate on ₹1000 taxable -> IGST ₹180 (18%)
 */
export function calculateInterStateTaxes(taxableAmount: number, gstRatePercent: number) {
  const taxable = new Decimal(taxableAmount);
  const rate = new Decimal(gstRatePercent).dividedBy(100);
  const igst = taxable.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    igstAmount: igst.toNumber(),
    totalTax: igst.toNumber(),
  };
}
