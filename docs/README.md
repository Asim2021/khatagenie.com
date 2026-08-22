# KhataGenie Documentation

Welcome to the **KhataGenie.com** documentation suite. This repository follows the living project-memory protocol defined in [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md).

KhataGenie is an AI-powered SaaS platform purpose-built for Chartered Accountant (CA) firms and GST tax consultants in Delhi NCR and across India. It automates the collection, OCR data extraction, mathematical verification, human review, and Tally/Excel export of physical paper bills and receipts sent via WhatsApp by MSME clients.

---

## Documentation Index

| File | Purpose | Canonical Role |
|---|---|---|
| [STATUS.md](file:///d:/My%20Projects/khatagenie.com/docs/STATUS.md) | Current project status, component health, and active work | Single source of truth for current state |
| [ROADMAP.md](file:///d:/My%20Projects/khatagenie.com/docs/ROADMAP.md) | High-level roadmap, strategic milestones, and deliverables | Project direction |
| [IMPLEMENTATION_PLAN.md](file:///d:/My%20Projects/khatagenie.com/docs/IMPLEMENTATION_PLAN.md) | Detailed technical specifications, schemas, and architecture | Engineering blueprint |
| [JOURNAL.md](file:///d:/My%20Projects/khatagenie.com/docs/JOURNAL.md) | Chronological daily engineering journal | Project history |
| [DECISIONS.md](file:///d:/My%20Projects/khatagenie.com/docs/DECISIONS.md) | Architectural and technical decision records (`DEC-xxx`) | Decision rationale & trade-offs |
| [EXPERIMENTS.md](file:///d:/My%20Projects/khatagenie.com/docs/EXPERIMENTS.md) | AI vision prompts, OCR benchmarks, and validation tests | Evidence & findings |
| [PROBLEMS.md](file:///d:/My%20Projects/khatagenie.com/docs/PROBLEMS.md) | Tracked bugs, failure modes, risks, and mitigations (`PROB-xxx`) | Risk & bug tracking |
| [IMPROVEMENTS.md](file:///d:/My%20Projects/khatagenie.com/docs/IMPROVEMENTS.md) | Backlog of technical and feature enhancements (`IMP-xxx`) | Future opportunities |
| [LESSONS.md](file:///d:/My%20Projects/khatagenie.com/docs/LESSONS.md) | Reusable domain & technical lessons learned (`LES-xxx`) | Organizational knowledge |
| [AGENT_TRACE.md](file:///d:/My%20Projects/khatagenie.com/docs/AGENT_TRACE.md) | Structured trace of agent actions, context, and decisions | Agent audit trail |
| [METRICS.md](file:///d:/My%20Projects/khatagenie.com/docs/METRICS.md) | OCR accuracy, processing speed, and latency KPIs | Performance tracking |
| [MILESTONES.md](file:///d:/My%20Projects/khatagenie.com/docs/MILESTONES.md) | Tracked progress across delivery milestones (`MILESTONE-xxx`) | Delivery milestones |
| [CHANGELOG.md](file:///d:/My%20Projects/khatagenie.com/docs/CHANGELOG.md) | Versioned release notes and package modifications | Release history |
| [HANDOFF.md](file:///d:/My%20Projects/khatagenie.com/docs/HANDOFF.md) | Current actionable state and context for subsequent agents | Agent-to-agent handoff |

---

## Core System Architecture

```text
MSME Client (WhatsApp)
       │
       ▼
Meta WhatsApp Cloud API (v19.0+)
       │
       ▼
apps/api (Fastify + TypeScript)
       ├── Webhook Auth & Media Download
       ├── Prisma ORM + PostgreSQL
       └── Modular Vision AI Service (NVIDIA Nemotron / GPT-4o-mini Vision)
       │
       ▼
apps/web (React 18 + Vite + Tailwind CSS)
       ├── Split-Screen Review Dashboard (Zoomable Image vs Editable Form)
       ├── Real-time GSTIN & Math Parity Validator
       └── 1-Click Exporters (Tally Prime XML & Excel GSTR-2 Registers)
```

---

## Feature Flag Mandate

All new features in this codebase are gated behind feature flags declared in `packages/types/src/featureFlags.ts` with default value `false`. Backend endpoints are protected with `requireFeature()` middleware in `apps/api`, and frontend UI components are protected with `<FeatureGate>` in `apps/web`.
