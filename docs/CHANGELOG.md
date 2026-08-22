# Changelog: KhataGenie.com

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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

