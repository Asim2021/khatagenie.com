import { validateGstin, extractPanFromGstin, getStateFromGstin, determineTaxStructure } from './src/gstUtils';
import { verifyInvoiceMath, calculateIntraStateTaxes, calculateInterStateTaxes } from './src/mathUtils';

console.log('--- Testing KhataGenie Shared GST & Math Utilities ---');

// Test 1: Delhi GSTIN Validation
const delhiGstin = '07AAAAA0000A1Z5';
const isValidDelhi = validateGstin(delhiGstin);
const stateName = getStateFromGstin(delhiGstin);
const pan = extractPanFromGstin(delhiGstin);
console.log(`[GST Test 1] Delhi GSTIN (${delhiGstin}): Valid=${isValidDelhi}, State=${stateName}, PAN=${pan}`);

if (!isValidDelhi || stateName !== 'Delhi' || pan !== 'AAAAA0000A') {
  throw new Error('Delhi GSTIN validation failed');
}

// Test 2: Haryana GSTIN Validation & Interstate check
const haryanaGstin = '06BBBBB1111B1Z2';
const taxTypeInter = determineTaxStructure(delhiGstin, haryanaGstin);
const taxTypeIntra = determineTaxStructure(delhiGstin, '07CCCCC2222C1Z9');
console.log(`[GST Test 2] Inter-state (Delhi -> Haryana): ${taxTypeInter} | Intra-state (Delhi -> Delhi): ${taxTypeIntra}`);

if (taxTypeInter !== 'INTER_STATE' || taxTypeIntra !== 'INTRA_STATE') {
  throw new Error('Tax structure determination failed');
}

// Test 3: Math parity calculation with ₹0.50 rounding tolerance
const mathPass = verifyInvoiceMath({
  taxableAmount: 1000.00,
  cgstAmount: 90.00,
  sgstAmount: 90.00,
  igstAmount: 0,
  roundOffAmount: 0.40,
  totalAmount: 1180.40,
});
console.log(`[Math Test 1] Balanced Invoice Check: Valid=${mathPass.isValid}, Delta=${mathPass.delta}`);

if (!mathPass.isValid) {
  throw new Error('Valid math parity calculation failed');
}

const mathFail = verifyInvoiceMath({
  taxableAmount: 1000.00,
  cgstAmount: 90.00,
  sgstAmount: 90.00,
  totalAmount: 1500.00, // Broken total
});
console.log(`[Math Test 2] Unbalanced Invoice Check: Valid=${mathFail.isValid}, ErrorMsg=${mathFail.errorMessage}`);

if (mathFail.isValid) {
  throw new Error('Unbalanced invoice should fail math check');
}

console.log('✅ ALL GST & MATH UTILITY TESTS PASSED SUCCESSFULLY!');
