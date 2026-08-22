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

## DEC-008: Production Security Hardening & Zero-Trust Verification
- **Date**: 2026-08-23
- **Status**: Accepted
- **Context**: Senior security threat model audit identified potential vulnerabilities in webhook signature handling, dev auth fallback, and file upload MIME validation.
- **Alternatives Considered**: Document as deployment caveats vs Hard-code defenses into the application runtime.
- **Selected Option**: Enforced runtime timing-safe HMAC-SHA256 signature verification, strict `NODE_ENV !== 'production'` auth fallback gating, environment-aware CORS whitelisting, and strict MIME type upload allowlists.
- **Reason for Selection**: Assures zero-trust security posture and guarantees security compliance out of the box.


