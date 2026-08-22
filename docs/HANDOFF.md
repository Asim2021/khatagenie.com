# Session Handoff: KhataGenie.com

**Current Objective**: TanStack Query (v5) Client Caching, Fast-Fail DB Resilience, and Branded Split-Screen Auth Layout.

**Current State**:
- Full monorepo stack is 100% built, tested, and verified across all 4 packages (`types`, `shared`, `api`, `web`).
- Phase 10 fully implemented: `@tanstack/react-query` v5 caching integrated across all React dashboard pages (`InboxPage`, `Gstr2bReconPage`, `ClientsPage`, `InvoiceReviewPage`).
- Fast-fail DB connection availability probe with 15s TTL caching added in `apps/api/src/lib/prisma.ts`.
- `AppLayout` in `apps/web/src/App.tsx` isolates `/login` route, removing the global `<Navbar />` on the auth page.
- `LoginPage.tsx` upgraded to a dual-column branded layout featuring KhataGenie's brand identity, tagline, 3 core value cards, Section 43B(h) compliance badges, and firm registration form.
- Full light/dark mode theming, Zero-FOUC head script, and mobile navigation active.
- All 14 living memory documentation files in `/docs` are synchronized with repository reality.

**Recently Completed**:
- Integrated `@tanstack/react-query` with standard 5-minute `staleTime`, 30-minute `gcTime`, and query deduplication.
- Refactored `Gstr2bReconPage`, `InboxPage`, `ClientsPage`, and `InvoiceReviewPage` to use `useQuery` and `useMutation` with automatic cache invalidation.
- Created `queryClient.ts` and wrapped `App.tsx` in `<QueryClientProvider>`.
- Replaced the standalone login card with a full-bleed split-screen branded layout with theme toggle.
- Added fast DB availability caching to avoid socket hang when running locally against a remote/offline database.
- Verified monorepo build (`npm run build`) and integration test suites: 100% Passed.

**Open Problems**:
- None (`PROB-001` through `PROB-006` resolved and tested).

**Important Decisions**:
- `DEC-009`: Synchronous inline head script for zero-FOUC theming, Tailwind class strategy, and mobile-first split-screen tab switcher.
- `DEC-010`: TanStack Query (v5) client caching architecture and dedicated branded auth layout.

**Things the Next Agent Should Know**:
- Start backend in development with `npm run dev:api`.
- Start frontend with `npm run dev:web`.
- Run full monorepo development with `npm run dev`.
- Run full test suite with `npx tsx packages/shared/test-verify.ts`, `npx tsx apps/api/test-server.ts`, and `npx tsx apps/api/test-recon.ts`.

**Recommended Next Actions**:
- Connect a live Meta WhatsApp Cloud API phone number ID in `.env` to test with physical WhatsApp bill messages.
- Deploy to Railway by connecting the GitHub repository.
