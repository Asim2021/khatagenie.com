# Daily Journal: KhataGenie.com

## 2026-08-22

### Objective
Initialize the KhataGenie.com workspace, setup the full living documentation suite per [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md), configure monorepo workspaces, establish the mandatory feature flag architecture, and build the shared type and utility libraries.

### Completed
- Authored initial project blueprint and architectural specification.
- Initialized canonical documentation suite under `/docs` (`README.md`, `STATUS.md`, `ROADMAP.md`, `IMPLEMENTATION_PLAN.md`, `JOURNAL.md`, `DECISIONS.md`, `EXPERIMENTS.md`, `PROBLEMS.md`, `IMPROVEMENTS.md`, `LESSONS.md`, `AGENT_TRACE.md`, `METRICS.md`, `MILESTONES.md`, `CHANGELOG.md`, `HANDOFF.md`).
- Established `packages/types` with complete `FEATURE_FLAGS` constants and tier defaults conforming to the zero-ungated-features mandate.
- Implemented `packages/shared` with Indian GST state code mapping, 15-char GSTIN validation, PAN extractor, and high-precision decimal math checker.
- Implemented `apps/api` with Fastify, Prisma PostgreSQL schema, seed data, JWT Auth, `requireFeature` route guard, WhatsApp Cloud API webhook handler, Modular Vision AI engine, Tally Prime XML generator, and Excel GSTR-2 exporter.
- Implemented `apps/web` with React 18, Vite, Tailwind CSS, Zoomable & High-contrast Image Viewer, Split-Screen Reviewer with math parity indicator, Client WhatsApp Directory, Export Center, and Superadmin Feature Flags manager.
- Configured `railway.json` for cloud deployment.
- Executed unit & integration test suites (`packages/shared/test-verify.ts`, `apps/api/test-server.ts`, `npm run build`): 100% Passed.

### Decisions
- `DEC-001`: Adopted Fastify framework for the backend due to schema-based JSON serialization speed and native TypeScript ecosystem.
- `DEC-002`: Implemented modular Vision AI service supporting standard OpenAI Chat Completions Vision API format to allow hot-swapping between NVIDIA Nemotron (dev) and GPT-4o-mini (prod).
- `DEC-003`: Centralized all feature flags in `packages/types/src/featureFlags.ts` with strict baseline `false` defaults.

## 2026-08-23

### Objective
Upgrade KhataGenie to enterprise production readiness: add GSTR-2B 2-way ITC reconciliation, pluggable cloud object storage, multi-page PDF processing, background extraction worker queue, CA auth onboarding, toast feedback, and full feature gating.

### Completed
- Registered 6 new feature flags with default `false` in `packages/types`.
- Created GSTR-2B 2-way ITC reconciliation service and interactive UI dashboard.
- Built pluggable storage service and multi-page PDF document processor.
- Built resilient background extraction queue with concurrency limit and retry backoff.
- Created `LoginPage.tsx` with CA firm registration, password hashing (bcrypt), and Quick Demo Fill.
- Added `/ready` database readiness probe and graceful shutdown handlers (`SIGTERM`, `SIGINT`).
- Implemented global `ToastContext` for user notifications.
- Conducted Ponytail whole-repo audit and STRIDE Threat Model & Security Audit (`senior-security`).
- Implemented Light & Dark Mode System with zero-FOUC synchronous head script.
- Implemented TanStack Query v5 Caching, fast-fail DB resilience, and table-to-card responsive mobile architecture.
- Connected Docker PostgreSQL at `localhost:5432`, applied schema migrations, and wiped all fake mock data.
- Built enterprise dual-token auth (Zustand in-memory + httpOnly cookie) with silent refresh and rotation.
- Fixed CSS cascade specificity with `@layer components` and created typed SVG icon library.
- Implemented Role-Based Access Control (RBAC) on Feature Flags Settings page.

## 2026-08-24

### Objective
Resolve Vision AI OCR extraction failures, purge legacy mock fallback data, apply client gating to upload flow, build live polling state update, enable single & bulk invoice actions, and perform full end-to-end browser verification.

### Completed
- Configured Real Google Gemini Flash AI OCR:
  - Diagnosed OCR endpoint mismatch in `apps/api/.env` (`/interactions` vs `/openai`).
  - Configured Google Gemini OpenAI-compatible completions endpoint (`https://generativelanguage.googleapis.com/v1beta/openai`).
  - Completely purged `generateDevMockExtraction` and all hardcoded `Shree Balaji Industrial Hardware` sample data.
  - Implemented multi-model fallback sequence (`gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-2.5-pro`) and dynamic MIME support for PNG, JPEG, WebP, SVG, and PDF.
  - Added dynamic dotenv reload in `vision.ts` to ensure runtime credential synchronization.
- Created Gated Upload Modal & 5-Step Lifecycle Guide:
  - Built `UploadModal.tsx` gating uploads when 0 clients exist, presenting an onboarding guide and direct link to Register Client.
  - Integrated MSME Client selection in upload form, linking uploaded bills directly to the registered client.
  - Added 5-step operational workflow onboarding banner to `InboxPage.tsx`.
- Implemented Real-Time Polling & Live Ingestion Updates:
  - Integrated smart polling in TanStack Query (`refetchInterval: 2500ms` when status is `PROCESSING`) in `InboxPage.tsx` and `InvoiceReviewPage.tsx`.
  - Invoices now appear immediately in the inbox with an `Extracting OCR...` spinner and dynamically update upon extraction completion without manual browser refresh (F5).
- Implemented Single & Bulk Actions:
  - Added floating dark Bulk Actions Toolbar with multi-select checkboxes for Bulk Approve, Bulk Reject, Bulk Delete, and Clear Selection.
  - Added single row-level Delete with cascading cleanup of invoice line items, database row, and storage file.
  - Added `POST /api/v1/invoices/:id/retry-ocr` endpoint and row-level "Retry" button for `EXTRACTION_FAILED` invoices.
- Resilient Schema & Decimal Coercion:
  - Updated `InvoiceItemSchema`, `InvoiceExtractionSchema`, and `InvoiceUpdateSchema` in `packages/types/src/invoice.ts` with `z.coerce.number()` and `.passthrough()`, safely accepting serialized Prisma Decimal strings.
- End-to-End Verification:
  - Ran monorepo production build (`npm run build`): 100% Passed across `types`, `shared`, `api`, `web`.
  - Conducted Playwright browser testing on `http://localhost:3000`:
    - Verified client gating in `UploadModal`.
    - Registered MSME client `Sunrise Retail & Wholesale`.
    - Uploaded `test_invoice.png`, observed real-time polling transition from `Extracting OCR...` to Gemini Flash extracted data.
    - Verified extracted data (`SUNRISE ENTERPRISE`, `07BGUPD3647K1Z8`, `INV-2026/089`, `₹30,000` taxable, `₹2,700` CGST, `₹2,700` SGST, `₹35,400` total, and 2 itemized line items).
    - Executed 1-click `Approve & Sync` in CA Review Studio, confirmed redirect to `/`, and verified invoice in `Approved` tab.
    - Verified Bulk Action Toolbar and Bulk Delete cleanup.

- Implemented Mandatory Rejection Reasons, Dedicated Rejected Tab & Action Audit Trail:
  - **Shared Types & Database Schema**:
    - Added `INVOICE_AUDIT_TRAIL: 'feature_invoice_audit_trail'` feature flag key to `packages/types/src/featureFlags.ts` (default `false` in `free` tier).
    - Added `rejectionReason` string field to Prisma `Invoice` model and shared `InvoiceUpdateSchema`/`InvoiceRecord`.
    - Created Prisma `InvoiceAuditLog` model recording every state mutation (`UPLOADED`, `OCR_PROCESSED`, `OCR_FAILED`, `UPDATED`, `APPROVED`, `REJECTED`, `RE_REVIEWED`, `EXPORTED`, `OCR_RETRIED`) with user relations and timestamp.
    - Executed `npx prisma db push` applying table schemas to PostgreSQL database.
  - **Backend Audit Service & Route Handlers**:
    - Created `AuditLogger` service (`apps/api/src/services/auditLogger.ts`).
    - Hooked audit log writes into `POST /upload`, `queue.ts` (`OCR_PROCESSED`, `OCR_FAILED`), `PATCH /invoices/:id` (approval/rejection/updates), `POST /invoices/bulk-status`, `POST /invoices/:id/retry-ocr`, and `routes/exports.ts` (`EXPORTED`).
    - Included `auditLogs` ordered descending in `GET /invoices/:id`.
  - **Frontend Dedicated Rejected Tab & Rejection Reason Prompt**:
    - Created `RejectReasonModal.tsx` supporting 7 accounting preset reasons (Blurry, Duplicate, Personal, Invalid GSTIN, Math Mismatch, Wrong Client, Other) and custom remarks.
    - Added `Rejected` filter tab with dynamic count badge and 5th KPI card in `InboxPage.tsx`.
    - Added rejection reason preview snippets and reviewer attribution in desktop table and mobile cards.
    - Added prominent `REJECTED INVOICE` status banner with "Reopen for Review" action in `InvoiceReviewPage.tsx`.
    - Created `InvoiceAuditTimeline.tsx` displaying full chronological audit history, embedded in `InvoiceReviewPage.tsx` behind `FEATURE_FLAGS.INVOICE_AUDIT_TRAIL`.
    - Wired bulk reject button in `InboxPage.tsx` floating toolbar to open `RejectReasonModal`.
  - **Verification**:
    - `npm run build`: 100% Passed with zero TypeScript errors across all monorepo workspaces (`types`, `shared`, `api`, `web`).

### Decisions
- `DEC-011`: Standardized on Google Gemini OpenAI-compatible completions endpoint (`/v1beta/openai`) with multi-model fallback chain (`gemini-3.7-flash` -> `gemini-3.6-flash` -> `gemini-2.5-pro`).
- `DEC-012`: Adopted `z.coerce.number()` across all financial data schemas to transparently accept both numeric floats and serialized Decimal strings.
- `DEC-013`: Enforced client-first ingestion gating: users must register an MSME client before ingesting bills to ensure proper multi-tenant ledger mapping and Section 43B(h) compliance.
- `DEC-014`: Mandatory Rejection Reason & Audit Logging: Every rejected invoice must capture an explicit reason (via presets or custom text), and all invoice state transitions are permanently recorded in `InvoiceAuditLog` with actor attribution.

### Lessons
- In Fastify/Prisma APIs, Decimal fields serialize to JSON strings. Using Zod `z.number()` without coercion causes schema validation failures on updates; `z.coerce.number()` resolves this seamlessly.
- When background worker queues process async jobs, smart client polling conditioned on active `PROCESSING` status provides instant visual feedback without requiring full WebSocket infrastructure.
- In professional accounting workflows, rejected bills must never be discarded silently or left ambiguous; requiring structured rejection reasons and dedicated tab filtering ensures compliance transparency for CAs and clients.
