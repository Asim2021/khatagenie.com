# Changelog: KhataGenie.com

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-08-24

### Added
- **Mandatory Rejection Reason Workflow**: Added `RejectReasonModal` with standard accounting reason presets (Blurry Bill, Duplicate, Non-GST, Invalid GSTIN, Math Mismatch, Wrong Client, Other) and custom notes required for both single and bulk rejection actions.
- **Dedicated Rejected Filter Tab & 5th KPI Card**: Added `Rejected` tab with live count badge and stat card in `InboxPage.tsx`.
- **Chronological Invoice Audit Trail**: Added Prisma `InvoiceAuditLog` model and `AuditLogger` service recording all lifecycle events (`UPLOADED`, `OCR_PROCESSED`, `OCR_FAILED`, `UPDATED`, `APPROVED`, `REJECTED`, `RE_REVIEWED`, `EXPORTED`, `OCR_RETRIED`) with actor attribution, timestamp, and metadata.
- **Feature Flag Gating**: Registered `INVOICE_AUDIT_TRAIL: 'feature_invoice_audit_trail'` in `packages/types/src/featureFlags.ts` (default `false` in `free` tier), guarding the `InvoiceAuditTimeline` component.
- **Decision Status Banners**: Added high-visibility status banners in `InvoiceReviewPage.tsx` for `REJECTED` (with reason and "Reopen for Review" action) and `APPROVED` invoices.

## [0.6.0] - 2026-08-24

### Added
- **Real Google Gemini Flash AI OCR**: Integrated Gemini OpenAI-compatible completions endpoint (`gemini-3.7-flash` -> `gemini-3.6-flash` -> `gemini-2.5-pro`) and purged dev mock sample data.
- **Client Gating & Upload Modal**: Added client verification before upload to enforce multi-tenant ledger mapping.
- **Live State Polling**: Integrated smart TanStack Query polling (`2500ms` during processing) for real-time inbox updates without manual page refreshes.
- **Multi-Select Bulk Actions**: Added floating bulk actions toolbar with multi-select checkboxes for Bulk Approve, Bulk Reject, and Bulk Delete.

## [0.5.0] - 2026-08-23

### Fixed
- **Input Field Icon Overlap Bug**: Wrapped all custom component classes in `apps/web/src/index.css` inside Tailwind's `@layer components`, ensuring utility modifiers (`pl-10`, `pl-16`, `pr-10`) naturally override base padding in the CSS cascade without specificity collisions.
- **Password Visibility Eye Button Alignment**: Vertically centered the toggle button at `top-1/2 -translate-y-1/2` for pixel-perfect alignment with leading icons.

### Added
- **Dedicated Modular SVG Icon Library**: Created `apps/web/src/components/icons/` with pure, type-safe SVG components (`IconProps`), eliminating external runtime dependencies and ensuring full theme inheritance (`currentColor`).
- **Form Architecture Policy**: Standardized on high-contrast top-aligned static labels over floating labels for B2B financial workflows (maximizing saccadic reading speed, eliminating autofill bugs, and cleanly supporting leading icons and `+91` phone prefixes).

## [0.4.0] - 2026-08-23

### Added
- **Dual-Mode Table-to-Card Architecture**:
  - `InboxPage.tsx`: Dense desktop data table (`md:block`) and rich interactive double-bezel cards (`md:hidden`) with GSTIN state pills, financial breakdown, live math balance check, and 1-tap review button.
  - `Gstr2bReconPage.tsx`: Desktop comparison table and 2-way mobile comparison cards with Books vs Portal entries, Section 16(2)(aa) ITC badge, tax breakdown, variance delta, and CA audit notes.
- **High-End Agency Visual Design System**:
  - Imported Google Font `Plus Jakarta Sans` as primary interface typeface alongside `Inter` and `JetBrains Mono`.
  - Configured `spring` (`cubic-bezier(0.16, 1, 0.3, 1)`) and `smooth` transition easing curves in `tailwind.config.js`.
  - Double-bezel (`Doppelrand`) container classes with outer translucent border and inner glowing surface (`shadow-inner-glow`).
- **Zero Horizontal Scroll Hardening**:
  - Global `overflow-x: hidden` and `max-width: 100vw` enforcement across all viewport widths (320px–1920px).
  - Responsive collapse of all forms, modals, tables, and toolbars verified with automated Playwright browser testing (`scrollWidth === innerWidth`).

## [0.3.0] - 2026-08-23

### Added
- **Production-Grade Light & Dark Mode System**: Full support for `'light'`, `'dark'`, and `'system'` themes, persistent `localStorage` cache, dynamic OS `matchMedia` sync, and cross-tab theme broadcast.
- **Zero-FOUC Architecture**: Synchronous inline head script and anti-flicker CSS eliminating 100% of white splash on initial load and refresh.
- **Theme Toggle Component**: Sleek desktop theme dropdown and mobile segmented theme selector in `Navbar.tsx`.
- **100% Mobile-Friendly Responsiveness**:
  - Collapsible mobile navigation drawer with touch target optimization (min 44px).
  - Adaptive Split-Screen Reviewer with instant mobile toggle between Document Scan and Extracted Form.
  - Touch-friendly horizontal scroll containers and mobile-responsive cards across all 7 pages.
- **Comprehensive Themed UI Polish**: Handcrafted high-contrast light mode (slate-50/white cards with emerald accents) and dark mode (slate-950/slate-900 surfaces) across all accounting tables, forms, modals, and toolbars.


### Security
- **Meta WhatsApp Webhook Verification**: Enforced timing-safe HMAC-SHA256 signature verification in `whatsappRoutes` and `whatsappService`, returning HTTP 401 on spoofed payloads.
- **Authentication Hardening**: Gated dev/seed admin login strictly to `NODE_ENV !== 'production'` and required exact password check.
- **Environment-Aware CORS Whitelisting**: Restricted origin reflection to configured `FRONTEND_URL` in production.
- **File Upload Protection**: Enforced strict MIME-type allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`) with HTTP 415 rejections for prohibited files.
- **Secure Static Headers**: Injected `X-Content-Type-Options: nosniff` onto static upload serving.

## [0.2.1] - 2026-08-23

### Changed
- **Ponytail Whole-Repo Simplification**:
  - Removed 7 unused/redundant dependencies across packages (`@tanstack/react-query`, `react-hook-form`, `tailwind-merge`, `clsx`, `zod` in web; `fastify-plugin`, `pino` in api).
  - De-duplicated ~75 lines of synchronous OCR extraction and DB persistence in WhatsApp service by unifying under `extractionQueue`.
  - Streamlined storage service from 3-tier class hierarchy into a clean disk service.
  - Flattened `pdfProcessor`, `excelExporter`, and `tallyExporter` single-method classes into direct, clean exported objects.
  - Verified 100% build pass and zero regressions across all test suites.

## [0.2.0] - 2026-08-23

### Added
- **GSTR-2B 2-Way ITC Reconciliation Engine**: Automatic matching between digitized client invoices and GST portal GSTR-2B filings with variance classification.
- **Background Extraction Queue**: Resilient asynchronous worker pool with concurrency control and automatic retries for Vision OCR.
- **Pluggable Storage & Multi-Page PDF Handling**: S3/R2 storage adapter and multi-page PDF document processing & pagination viewer.
- **Production CA Onboarding & Auth**: Sign in, CA firm registration, password hashing (bcrypt), and Quick Demo autofill.
- **Global Toast Notification System**: Real-time CA feedback on actions.
- **Readiness Probes & Graceful Shutdown**: Added `/ready` database health endpoint and `SIGTERM`/`SIGINT` process hooks.
- **Expanded Feature Flags**: Added `MULTI_PAGE_PDF`, `CLOUD_STORAGE_R2`, `ASYNC_EXTRACTION_QUEUE`, `GSTR2B_RECONCILIATION`, `WHATSAPP_INTERACTIVE_BOT`, `BUSY_ACCOUNTING_EXPORT` (all defaulting to `false`).

## [0.1.0] - 2026-08-22

### Added
- Complete project living memory suite under `/docs` following [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md) protocol.
- Architecture blueprint and technical specifications for WhatsApp ingestion, AI Vision extraction, Split-screen CA review, and Tally Prime XML export.
- Centralized Feature Flag infrastructure in `packages/types/src/featureFlags.ts` with default `false` values across all tiers.
- Shared Indian GST verification logic (15-character GSTIN regex, state codes, PAN parser) and decimal math checker in `packages/shared`.

