# Canonical Implementation Plan: KhataGenie.com

## 1. System Architecture Overview

KhataGenie bridges unformatted mobile photos of physical receipts with formal accounting and tax systems (Tally Prime / Excel) through an automated pipeline:

```text
[WhatsApp User] -> [Meta Cloud API] -> [Fastify Webhook] -> [Vision AI Engine]
                                                                     │
                                                                     ▼
[Tally Prime / Excel] <- [Export Engine] <- [CA Review Dashboard] <- [PostgreSQL / Prisma]
```

---

## 2. Monorepo Structure

```text
khatagenie.com/
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & Feature Flags
│   │   ├── src/
│   │   │   ├── featureFlags.ts # FEATURE_FLAGS, TIER_FEATURE_DEFAULTS
│   │   │   ├── invoice.ts      # Invoice, LineItem, Extraction schemas
│   │   │   ├── client.ts       # Client & Organization models
│   │   │   ├── auth.ts         # User, JWT payload, Role types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # Shared GST & Math utilities
│       ├── src/
│       │   ├── gstUtils.ts     # GSTIN regex, state codes, PAN parser
│       │   ├── mathUtils.ts    # Decimal tax parity checks
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── api/                    # Fastify Backend Service
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # PostgreSQL models
│   │   │   └── seed.ts         # Mock data for Delhi CA firms & MSMEs
│   │   ├── src/
│   │   │   ├── middleware/     # Auth & featureGuard.ts
│   │   │   ├── routes/         # auth, invoices, clients, exports, whatsapp
│   │   │   ├── services/       # vision.ts, whatsapp.ts, tally.ts, excel.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # React 18 + Vite Frontend Dashboard
│       ├── src/
│       │   ├── components/     # Split-screen viewer, FeatureGate, Nav
│       │   ├── pages/          # Inbox, InvoiceReview, Clients, Exports
│       │   ├── hooks/          # useFeatureFlag, useInvoices
│       │   ├── lib/            # api client, hotkeys
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                       # Canonical project memory suite
├── package.json                # Root workspace configuration
└── tsconfig.base.json          # Shared TypeScript configuration
```

---

## 3. Data & Extraction Contracts

### 3.1 Indian GST Rules
- **GSTIN Format**: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- **State Tax Rules**:
  - Intra-state (Supplier State Code == Buyer State Code): Equal split of CGST & SGST ($CGST = SGST = \frac{Tax}{2}$).
  - Inter-state (Supplier State Code != Buyer State Code): IGST applies ($IGST = Tax, CGST = SGST = 0$).

### 3.2 Feature Flag Specification
Feature flags default to `false` across all tiers in `packages/types/src/featureFlags.ts`:
- `FEATURE_FLAGS.WHATSAPP_INGESTION`: `'feature_whatsapp_ingestion'`
- `FEATURE_FLAGS.AI_VISION_EXTRACTION`: `'feature_ai_vision_extraction'`
- `FEATURE_FLAGS.SPLIT_SCREEN_REVIEW`: `'feature_split_screen_review'`
- `FEATURE_FLAGS.TALLY_XML_EXPORT`: `'feature_tally_xml_export'`
- `FEATURE_FLAGS.EXCEL_EXPORT`: `'feature_excel_export'`
- `FEATURE_FLAGS.DIRECT_UPLOAD`: `'feature_direct_upload'`
