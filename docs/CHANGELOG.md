# Changelog: KhataGenie.com

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-08-22

### Added
- Complete project living memory suite under `/docs` following [AGENTS.md](file:///d:/My%20Projects/khatagenie.com/AGENTS.md) protocol.
- Architecture blueprint and technical specifications for WhatsApp ingestion, AI Vision extraction, Split-screen CA review, and Tally Prime XML export.
- Centralized Feature Flag infrastructure in `packages/types/src/featureFlags.ts` with default `false` values across all tiers.
- Shared Indian GST verification logic (15-character GSTIN regex, state codes, PAN parser) and decimal math checker in `packages/shared`.
