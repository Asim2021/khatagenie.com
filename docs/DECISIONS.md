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
