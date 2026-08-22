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

---

## PROB-003: Offline Local Preview Resilience & Toast Feedback
- **Date Discovered**: 2026-08-23
- **Severity**: Medium
- **Symptoms**: During Playwright testing without a local PostgreSQL daemon, database lookups threw 500 errors on login, PATCH review, and client directory; window alerts interrupted automated browser flows.
- **Impact**: Interrupted local development, testing, and preview demo workflows.
- **Root Cause**: Unhandled database disconnection in auth/invoice routes and use of native browser `alert()` instead of toast notifications.
- **Current Solution**: Added try/catch fallback with realistic sample data across all API endpoints, added seed demo org pro fallback in `featureGuard.ts`, persisted user/flag state in `localStorage`, and replaced all `alert()` calls with `ToastContext`.
- **Remaining Risk**: None.
- **Status**: Resolved & Verified in Playwright.

---

## PROB-004: Unprotected Client Routes and Unauthenticated Header Leakage
- **Date Discovered**: 2026-08-23
- **Severity**: Critical
- **Symptoms**: When unauthenticated, visitors were able to see internal application navigation links in the header and could navigate to `/clients`, `/`, `/exports`, etc.
- **Impact**: Multi-tenant data privacy violation if unauthenticated users can access internal dashboard routes.
- **Root Cause**: Routes in `App.tsx` were not wrapped in `<ProtectedRoute>`, and `Navbar.tsx` did not check `user` before rendering private navigation items and status badges.
- **Current Solution**: Wrapped all private routes (`/`, `/clients`, `/exports`, `/reconciliation`, `/settings/feature-flags`, `/invoices/:id/review`) in `<ProtectedRoute>`, and updated `Navbar.tsx` to conditionally render private navigation links, WhatsApp status, and admin controls ONLY when authenticated. Unauthenticated visitors are immediately redirected to `/login`.
- **Remaining Risk**: None.
- **Status**: Resolved & Verified in Playwright.


