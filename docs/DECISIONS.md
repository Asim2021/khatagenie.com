# Architecture Decision Records (ADRs): KhataGenie.com

This document tracks all significant architectural and technical decisions made in this repository.

---

## DEC-001: Backend Framework Selection (Fastify over Express)
- **Date**: 2026-08-22
- **Status**: Accepted
- **Context**: Need a high-throughput, TypeScript-first Node.js framework capable of parsing incoming WhatsApp webhooks (<200ms latency), streaming large image uploads, and validating API schemas.
- **Alternatives Considered**: Express.js, Nest.js, Fastify.
- **Selected Option**: Fastify.
- **Reason for Selection**: Fastify provides significantly higher throughput (up to 2x faster JSON serialization with `fast-json-stringify`), native async/await lifecycle hooks, built-in schema validation, and lightweight plugin architecture.
- **Trade-offs**: Slightly fewer legacy third-party middlewares than Express, easily offset by official `@fastify/*` plugins.
- **Risks**: None identified.

---

## DEC-002: Modular Vision AI Architecture (OpenAI-Compatible Spec)
- **Date**: 2026-08-22
- **Status**: Accepted
- **Context**: The OCR engine must extract structured JSON from unstructured bill photos. We need flexibility to use local/dev endpoints (NVIDIA NIM Nemotron Vision) and low-cost production endpoints (GPT-4o-mini / Gemini Flash) without altering backend business logic.
- **Alternatives Considered**: Hardcoded single-provider SDK (OpenAI SDK only, Google Vertex SDK only), Custom HTTP client following OpenAI Chat Completions Vision spec.
- **Selected Option**: Modular service utilizing standard OpenAI-compatible completions API with configurable `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.
- **Reason for Selection**: Maximizes developer agility, eliminates vendor lock-in, and enables instantaneous switching between cost-effective models.
- **Trade-offs**: Requires prompt tuning to ensure structured JSON consistency across models.
- **Risks**: Minor schema deviations between models mitigated by strict Zod schema parsing and repair fallback.

---

## DEC-003: Feature Flag Gating Mandate Implementation
- **Date**: 2026-08-22
- **Status**: Accepted
- **Context**: Mandate in [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md) requires all new features to default to `false` and be protected at both route and UI layers.
- **Alternatives Considered**: In-memory config flags, Third-party service (LaunchDarkly), Centralized shared types + Fastify pre-handler + React context.
- **Selected Option**: Centralized enum in `packages/types/src/featureFlags.ts` combined with `requireFeature` pre-handler middleware in `apps/api` and `<FeatureGate>` wrapper in `apps/web`.
- **Reason for Selection**: Fully type-safe, zero external network dependency, and ensures 100% compliance with repository rules.

---

## DEC-004: Database & ORM (PostgreSQL + Prisma)
- **Date**: 2026-08-22
- **Status**: Accepted
- **Context**: Need relational integrity for multi-tenant CA organizations, MSME clients, invoices, and line items, plus JSONB support for raw AI OCR payloads.
- **Alternatives Considered**: MongoDB, MySQL, PostgreSQL + Prisma.
- **Selected Option**: PostgreSQL with Prisma ORM.
- **Reason for Selection**: Strong ACID guarantees, native JSONB support for storing complete unparsed AI responses for auditability, and type-safe Prisma Client generation.
- **Trade-offs**: Migration management required.
- **Risks**: Schema changes require migration tracking (`prisma migrate`).

---

## DEC-005: Decoupled Background Worker Queue for Vision OCR
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Long-running Vision AI extraction (5-15s per bill) could cause Meta WhatsApp webhooks to time out if handled synchronously.
- **Alternatives Considered**: Synchronous route handler, BullMQ / Redis, In-memory concurrency worker queue with exponential backoff.
- **Selected Option**: In-memory concurrency-limited worker queue (`ExtractionQueue`) with exponential backoff retries.
- **Reason for Selection**: Eliminates external Redis dependency for lightweight single-instance and staging deployments while ensuring instant `200 OK` acknowledgment to Meta webhooks.

---

## DEC-006: GSTR-2B 2-Way Reconciliation Matching Standard
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: CAs need automated cross-verification of client WhatsApp bills against government GSTR-2B filing JSONs to enforce Rule 36(4) Input Tax Credit compliance.
- **Alternatives Considered**: Exact matching only, Fuzzy normalized invoice number + GSTIN matching with ±₹2.00 rounding tolerance.
- **Selected Option**: Fuzzy normalized matching with ±₹2.00 tax variance tolerance and 4-state categorization (Matched, Tax Mismatch, Missing in Books, Missing in 2B).
- **Reason for Selection**: Handles realistic real-world invoice number variations (e.g. `INV-001` vs `INV001`) and standard rounding adjustments while detecting missing credits.

---

## DEC-007: Lean Codebase Simplification & Strict YAGNI (Ponytail)
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Codebase audit identified unimported dependencies and repetitive service classes.
- **Alternatives Considered**: Keep unused dependencies for future speculative phases vs Prune immediately.
- **Selected Option**: Pruned 7 unused dependencies and unified WhatsApp ingestion directly under the background worker queue.
- **Reason for Selection**: Minimizes bundle bloat, prevents webhook timeout regressions, and improves build performance.

---

---

## DEC-009: Zero-FOUC Synchronous Head Script, Class Theming & Mobile-First Split Screen
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Need a robust, production-grade Light and Dark mode system supporting Light, Dark, and System preference with zero white flash (FOUC) on refresh, and full 100% mobile responsiveness across all pages.
- **Alternatives Considered**: Client-only React `useEffect` theme loading, Next.js / SSR-only theming, Synchronous blocking `<script>` in `<head>` + Tailwind `darkMode: 'class'` + responsive mobile drawer & split-screen switcher.
- **Selected Option**: Synchronous inline `<script>` in `index.html` `<head>` coupled with Tailwind CSS `darkMode: 'class'`, reactive `ThemeContext`, cross-tab broadcast, and adaptive mobile tab switcher for split-screen review.
- **Reason for Selection**: Synchronous head execution runs prior to initial paint, completely eliminating the white splash on reload (FOUC). The mobile tab switcher provides a first-class mobile experience on small phone screens without sacrificing desktop split-screen productivity.
- **Trade-offs**: Requires dark mode class coverage across all UI cards, tables, badges, and modals.
- **Risks**: None; verified across all pages.

---

## DEC-010: TanStack Query (v5) Client Caching & Dedicated Branded Auth Layout
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Route navigation was triggering repetitive un-cached network requests (`useEffect` + `useState`), and React 18 `StrictMode` triggered dual fetches on mount. Additionally, the global `<Navbar />` rendered unconditionally on `/login`, displaying a redundant "Sign In" button on the login screen itself.
- **Alternatives Considered**: Retain manual `useEffect` fetching, Custom in-memory context cache, Full `@tanstack/react-query` v5 integration + dedicated auth layout.
- **Selected Option**: Adopted `@tanstack/react-query` (v5) with standard caching policies (`staleTime: 5m`, `gcTime: 30m`), automatic query deduplication, declarative cache invalidation across mutations, and restructured `App.tsx` layout to isolate `/login` with a full-bleed branded split-screen showcase.
- **Reason for Selection**: Eliminates route transition latency (data renders instantly from cache), drops duplicate StrictMode requests, auto-syncs UI states across mutations, and transforms `/login` into a high-converting CA value showcase.
- **Trade-offs**: Adds `@tanstack/react-query` dependency to `apps/web`.
- **Risks**: None; verified with full build and test suites.

---

## DEC-011: Dual-Mode Table-to-Card Responsive Architecture & Agency-Grade Visual Design System
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Standard HTML tables overflow horizontally on mobile devices (320px–412px viewports), creating clumsy horizontal scrollbars and degraded mobile usability. The platform required a high-end agency visual revamp with 100% zero horizontal scroll.
- **Alternatives Considered**: 
  1. Horizontal scrolling tables with `overflow-x: auto` on mobile.
  2. CSS table column collapsing (hiding non-essential columns).
  3. Dual-Mode rendering: Full dense HTML table on desktop screens (`md:block`), and high-density, double-bezel interactive cards on mobile screens (`md:hidden`).
- **Selected Option**: Dual-Mode Table-to-Card architecture (Option 3) powered by Google Font `Plus Jakarta Sans`, `spring` cubic-bezier transitions, and double-bezel (Doppelrand) card tokens.
- **Reason for Selection**: Completely eliminates horizontal scrolling (`scrollWidth === innerWidth`), ensures 100% of GST metadata and financial figures remain accessible on mobile, and provides 1-tap touch actions (WhatsApp chat, CA review studio, voucher downloads) optimized for mobile fingers.
- **Trade-offs**: Requires dual template markup in `InboxPage.tsx` and `Gstr2bReconPage.tsx`.
- **Risks**: None; verified via automated Playwright viewport evaluations across all target screen sizes.

---

## DEC-012: High-Contrast Multi-Tier Button Design System (Light vs Dark Mode)
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Buttons previously used identical emerald background colors and dark text in both light and dark modes, resulting in poor contrast and a washed-out "highlighter" look in Light Mode.
- **Alternatives Considered**: 
  1. Universal single-color buttons across both modes.
  2. Mode-adapted multi-tier button tokens (`.btn-primary`, `.btn-secondary`, `.btn-action`, `.btn-sky`, `.btn-danger`) with distinct light (deep emerald + crisp white text, 7.5:1 WCAG AAA) and dark (neon glowing emerald + obsidian text) contrast treatments.
- **Selected Option**: Option 2 (`.btn-primary`, `.btn-secondary`, `.btn-action`, etc.) in `index.css`.
- **Reason for Selection**: Ensures crisp contrast, authoritative visual hierarchy, and distinct aesthetic personality in both Light and Dark modes.
- **Trade-offs**: None; unified in global design tokens.
- **Risks**: None; verified with Playwright screenshots in both modes.

---

## DEC-013: Portal-Based Top-Level Modal Stacking & Top-Right Notification Toast Architecture
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Modals rendered inside deeply nested page components suffered from CSS stacking context constraints where sticky `<Navbar>` (z-40) rendered over modal backdrops, creating a double-blurred top horizontal seam. Notifications also lacked a standardized top-right positioning with rich status indicators.
- **Alternatives Considered**: 
  1. Manual z-index bumping on nested components without portals.
  2. React Portals (`createPortal(..., document.body)`) with body scroll locking, combined with a top-right fixed notification system (`z-[9999]`) and fast-path offline DB CRUD handlers.
- **Selected Option**: Option 2 (React Portals for all modal overlays + top-right double-bezel toast notifications + resilient in-memory offline CRUD with `isDatabaseOnline` fast probe).
- **Reason for Selection**: Eliminates all browser stacking context artifacts across sticky headers, ensures seamless viewport-wide backdrop blur, provides authoritative visual feedback for all operations, and guarantees 100% CRUD testability offline.
- **Trade-offs**: None.
- **Risks**: None; verified via automated Playwright screenshots and end-to-end integration tests.

