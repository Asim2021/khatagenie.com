# Lessons Learned: KhataGenie.com

This document records reusable domain and technical insights discovered during development.

---

## LES-001: Indian GSTIN Structure & State Code Handling
- **Context**: Every GSTIN is a 15-character string where the first two digits represent the State Code (e.g. `07` for Delhi, `06` for Haryana, `09` for Uttar Pradesh).
- **Insight**: Checking if `supplierGstin.slice(0, 2) === buyerGstin.slice(0, 2)` deterministically dictates whether an invoice is intra-state (CGST + SGST) or inter-state (IGST).
- **Application**: The validation engine and Tally ledger mapper use this rule to automatically prevent incorrect tax head assignments.

---

## LES-002: Tally Prime XML Encoding & Date Format
- **Context**: Tally Prime's XML import parser fails if dates are in standard ISO-8601 (`YYYY-MM-DD`).
- **Insight**: Tally Prime strictly expects dates in `YYYYMMDD` format (e.g. `20260822`) inside `<DATE>` tags and requires amounts with positive/negative signs representing debit (`Yes` / negative amount in entry) vs credit (`No` / positive amount in entry).
- **Application**: Implemented explicit Tally XML formatters in `src/services/tallyExporter.ts`.
