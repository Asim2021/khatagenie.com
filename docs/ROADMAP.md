# Project Roadmap: KhataGenie.com

**Strategic Objective**: Deliver a production-grade, end-to-end automated invoice extraction and CA review system tailored for the Delhi NCR market and Indian GST compliance.

---

## Phase Breakdown

### 🎯 Phase 1: Workspace Scaffolding & Documentation (Current)
- Monorepo structure with npm workspaces (`packages/types`, `packages/shared`, `apps/api`, `apps/web`).
- Living documentation suite under `/docs` meeting [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md) standards.
- Feature flag infrastructure setup with default `false` baseline.

### 🎯 Phase 2: Shared Types, GST Models & Validation Utilities
- TypeScript types and Zod schemas for invoices, clients, organizations, and feature flags.
- Indian GST validation algorithms (15-character GSTIN regex, state codes, PAN extraction).
- High-precision monetary math validator with tolerance for rounding adjustments.

### 🎯 Phase 3: Database & Backend Architecture (`apps/api`)
- PostgreSQL schema managed with Prisma ORM.
- Fastify server configuration with Helmet, CORS, JWT Auth, and Pino logging.
- Multi-tenant data isolation (CA Firm Organization $\rightarrow$ Clients $\rightarrow$ Invoices).
- Feature flag middleware `requireFeature()` guarding API routes.
- Seed data with realistic Delhi NCR CA firms, MSME clients, and mock invoices.

### 🎯 Phase 4: WhatsApp Cloud API & Ingestion Service
- Meta webhook verification (`GET`) and SHA-256 HMAC payload verification (`POST`).
- Media download from Meta Graph API v19.0+ and binary persistence.
- Phone number lookup to automatically map WhatsApp sender to MSME client.
- Asynchronous extraction job dispatch.

### 🎯 Phase 5: Modular Vision AI Extraction Engine
- Modular LLM Vision client supporting OpenAI-compatible endpoints (NVIDIA Nemotron NIM & GPT-4o-mini).
- Strict JSON schema enforcement for Indian GST tax invoices, retail bills, and cash receipts.
- Automatic calculation of CGST, SGST, IGST, taxable amounts, and confidence scoring.
- Mathematical parity check and error flagging.

### 🎯 Phase 6: React Split-Screen Review Dashboard (`apps/web`)
- Modern, high-density CA dashboard with Tailwind CSS.
- Split-screen workspace: Pan/Zoom/Rotate/Contrast-adjusted image viewer on left, reactive editable form on right.
- Real-time GSTIN lookup status and math parity indicators.
- Rapid review keyboard shortcuts (`Cmd/Ctrl+Enter` to approve, `Tab` traversal).
- Client management and WhatsApp number mapping directory.
- `<FeatureGate>` and `useFeatureFlag` integration.

### 🎯 Phase 7: Export Services (Tally Prime & Excel)
- Tally Prime XML purchase voucher generator with ledger mapping.
- Standard GSTR-2 purchase register Excel generator (.xlsx).
- Batch export functionality for approved vouchers.

### 🎯 Phase 8: Deployment & Hardening
- Railway deployment configuration (PostgreSQL + Fastify backend).
- Environment configuration and security audit.
- Automated end-to-end integration tests.

### 🎯 Phase 9: Production-Grade Light & Dark Mode System, Zero-FOUC & 100% Mobile Responsiveness (Current)
- Zero-FOUC (Flash of Unstyled Content) synchronous inline theme initialization script in `<head>`.
- React `ThemeContext` & `ThemeProvider` supporting `'light' | 'dark' | 'system'` modes with `localStorage` and `matchMedia` sync.
- Interactive desktop `<ThemeToggle />` and mobile segmented theme switcher.
- 100% Mobile-Friendly responsive design across all screens, drawers, modals, tables, and Split-Screen CA Reviewer (with mobile Scan vs Form view switcher).
- Tailored light mode (clean slate-50/white cards with emerald accents) and dark mode (slate-950/slate-900 surfaces) across all 7 pages.

