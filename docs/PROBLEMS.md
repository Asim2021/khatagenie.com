# Problems & Risks Registry: KhataGenie.com

This document tracks known issues, risks, root causes, and resolutions.

---

## PROB-001: WhatsApp Cloud API Webhook Response Timeout
- **Date Discovered**: 2026-08-22
- **Severity**: High
- **Symptoms**: Meta WhatsApp Webhook requires an immediate HTTP 200 within 15 seconds. If Vision AI processing takes 4–8 seconds, network jitter can trigger Meta webhook retries and duplicate invoice entries.
- **Impact**: Duplicate invoices created in DB; WhatsApp webhook might get temporarily disabled by Meta for timeout errors.
- **Root Cause**: Synchronous processing of heavy OCR/Vision API calls inside the HTTP request lifecycle.
- **Current Solution**: Decouple reception from processing. The webhook handler immediately saves the incoming payload to DB with status `RECEIVED`, returns HTTP 200 OK to Meta, and dispatches the Vision AI extraction asynchronously.
- **Remaining Risk**: Minimal; ensure unhandled promise rejections are trapped in the async worker.
- **Status**: Mitigated / Architecture Designed.

---

## PROB-002: Math Discrepancies on Invoices due to Rounding
- **Date Discovered**: 2026-08-22
- **Severity**: Medium
- **Symptoms**: In Indian GST invoices, line-item tax calculations often produce fractions of a paisa (e.g. ₹12.45), resulting in grand total rounding differences of ±₹1.00.
- **Impact**: Strict math checks (`Taxable + CGST + SGST = Total`) might incorrectly flag valid invoices as mathematically corrupt.
- **Root Cause**: Real-world vendor POS systems apply differing rounding rules (floor, ceil, round-half-up).
- **Current Solution**: Implement `verifyInvoiceMath()` with a configurable tolerance window of ₹1.00 (`Math.abs(calculated - total) <= 1.00`).
- **Remaining Risk**: None.
- **Status**: Resolved in `packages/shared/src/mathUtils.ts`.
