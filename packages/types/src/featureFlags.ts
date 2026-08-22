/**
 * Feature Flag Definitions and Tier Defaults for KhataGenie.com
 * Mandated by Project Protocol: Every new feature MUST be declared here
 * with baseline default value of `false`.
 */

export const FEATURE_FLAGS = {
  WHATSAPP_INGESTION: 'feature_whatsapp_ingestion',
  AI_VISION_EXTRACTION: 'feature_ai_vision_extraction',
  SPLIT_SCREEN_REVIEW: 'feature_split_screen_review',
  TALLY_XML_EXPORT: 'feature_tally_xml_export',
  EXCEL_EXPORT: 'feature_excel_export',
  DIRECT_UPLOAD: 'feature_direct_upload',
  ADVANCED_GSTIN_VALIDATION: 'feature_advanced_gstin_validation',
  BULK_APPROVAL: 'feature_bulk_approval',
  MULTI_PAGE_PDF: 'feature_multi_page_pdf',
  CLOUD_STORAGE_R2: 'feature_cloud_storage_r2',
  ASYNC_EXTRACTION_QUEUE: 'feature_async_extraction_queue',
  GSTR2B_RECONCILIATION: 'feature_gstr2b_reconciliation',
  WHATSAPP_INTERACTIVE_BOT: 'feature_whatsapp_interactive_bot',
  BUSY_ACCOUNTING_EXPORT: 'feature_busy_accounting_export',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export interface FeatureFlagMetadata {
  key: FeatureFlagKey;
  label: string;
  description: string;
  category: 'ingestion' | 'ai' | 'review' | 'export' | 'admin' | 'reconciliation';
}

export const FEATURE_FLAG_METADATA: Record<FeatureFlagKey, FeatureFlagMetadata> = {
  [FEATURE_FLAGS.WHATSAPP_INGESTION]: {
    key: FEATURE_FLAGS.WHATSAPP_INGESTION,
    label: 'WhatsApp Bill Ingestion',
    description: 'Enables automatic bill receiving via Meta WhatsApp Cloud API webhooks.',
    category: 'ingestion',
  },
  [FEATURE_FLAGS.AI_VISION_EXTRACTION]: {
    key: FEATURE_FLAGS.AI_VISION_EXTRACTION,
    label: 'AI Vision OCR Extraction',
    description: 'Enables LLM-powered OCR data extraction for invoice images.',
    category: 'ai',
  },
  [FEATURE_FLAGS.SPLIT_SCREEN_REVIEW]: {
    key: FEATURE_FLAGS.SPLIT_SCREEN_REVIEW,
    label: 'Split-Screen CA Reviewer',
    description: 'Enables high-resolution zoomable split-screen review interface with hotkeys.',
    category: 'review',
  },
  [FEATURE_FLAGS.TALLY_XML_EXPORT]: {
    key: FEATURE_FLAGS.TALLY_XML_EXPORT,
    label: 'Tally Prime XML Export',
    description: 'Enables 1-click generation of Tally Prime compatible accounting vouchers.',
    category: 'export',
  },
  [FEATURE_FLAGS.EXCEL_EXPORT]: {
    key: FEATURE_FLAGS.EXCEL_EXPORT,
    label: 'Excel GSTR-2 Export',
    description: 'Enables downloading formatted Excel purchase registers for tax filing.',
    category: 'export',
  },
  [FEATURE_FLAGS.DIRECT_UPLOAD]: {
    key: FEATURE_FLAGS.DIRECT_UPLOAD,
    label: 'Direct File Upload',
    description: 'Allows CAs to directly drag-and-drop receipt images and PDFs in web dashboard.',
    category: 'ingestion',
  },
  [FEATURE_FLAGS.ADVANCED_GSTIN_VALIDATION]: {
    key: FEATURE_FLAGS.ADVANCED_GSTIN_VALIDATION,
    label: 'Real-time GSTIN Lookup & Verification',
    description: 'Enables automated live GST portal verification of supplier tax identifiers.',
    category: 'review',
  },
  [FEATURE_FLAGS.BULK_APPROVAL]: {
    key: FEATURE_FLAGS.BULK_APPROVAL,
    label: 'Bulk Invoice Approval',
    description: 'Allows approving and exporting multiple mathematically-balanced invoices simultaneously.',
    category: 'review',
  },
  [FEATURE_FLAGS.MULTI_PAGE_PDF]: {
    key: FEATURE_FLAGS.MULTI_PAGE_PDF,
    label: 'Multi-Page PDF Extraction & Viewer',
    description: 'Enables splitting, OCR processing, and pagination for multi-page tax invoice PDFs.',
    category: 'ingestion',
  },
  [FEATURE_FLAGS.CLOUD_STORAGE_R2]: {
    key: FEATURE_FLAGS.CLOUD_STORAGE_R2,
    label: 'Cloud Object Storage (S3/R2)',
    description: 'Persists invoice documents to durable Cloudflare R2 / AWS S3 storage buckets.',
    category: 'admin',
  },
  [FEATURE_FLAGS.ASYNC_EXTRACTION_QUEUE]: {
    key: FEATURE_FLAGS.ASYNC_EXTRACTION_QUEUE,
    label: 'Resilient Background OCR Queue',
    description: 'Processes Vision AI extractions asynchronously with concurrency control and automatic retries.',
    category: 'ai',
  },
  [FEATURE_FLAGS.GSTR2B_RECONCILIATION]: {
    key: FEATURE_FLAGS.GSTR2B_RECONCILIATION,
    label: 'GSTR-2B 2-Way ITC Reconciliation',
    description: 'Automated 2-way matching between digitized books and GST portal GSTR-2B filing JSONs.',
    category: 'reconciliation',
  },
  [FEATURE_FLAGS.WHATSAPP_INTERACTIVE_BOT]: {
    key: FEATURE_FLAGS.WHATSAPP_INTERACTIVE_BOT,
    label: 'WhatsApp Interactive Confirmation Bot',
    description: 'Sends interactive confirmation buttons and status updates directly to MSME clients on WhatsApp.',
    category: 'ingestion',
  },
  [FEATURE_FLAGS.BUSY_ACCOUNTING_EXPORT]: {
    key: FEATURE_FLAGS.BUSY_ACCOUNTING_EXPORT,
    label: 'Busy Accounting XML Export',
    description: 'Exports approved purchase vouchers formatted for North India Busy Accounting software.',
    category: 'export',
  },
};

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Baseline Tier Feature Defaults.
 * IMPORTANT: All new flags MUST default to `false` in `free` and baseline definitions.
 */
export const TIER_FEATURE_DEFAULTS: Record<SubscriptionTier, Record<FeatureFlagKey, boolean>> = {
  free: {
    [FEATURE_FLAGS.WHATSAPP_INGESTION]: false,
    [FEATURE_FLAGS.AI_VISION_EXTRACTION]: false,
    [FEATURE_FLAGS.SPLIT_SCREEN_REVIEW]: false,
    [FEATURE_FLAGS.TALLY_XML_EXPORT]: false,
    [FEATURE_FLAGS.EXCEL_EXPORT]: false,
    [FEATURE_FLAGS.DIRECT_UPLOAD]: false,
    [FEATURE_FLAGS.ADVANCED_GSTIN_VALIDATION]: false,
    [FEATURE_FLAGS.BULK_APPROVAL]: false,
    [FEATURE_FLAGS.MULTI_PAGE_PDF]: false,
    [FEATURE_FLAGS.CLOUD_STORAGE_R2]: false,
    [FEATURE_FLAGS.ASYNC_EXTRACTION_QUEUE]: false,
    [FEATURE_FLAGS.GSTR2B_RECONCILIATION]: false,
    [FEATURE_FLAGS.WHATSAPP_INTERACTIVE_BOT]: false,
    [FEATURE_FLAGS.BUSY_ACCOUNTING_EXPORT]: false,
  },
  pro: {
    [FEATURE_FLAGS.WHATSAPP_INGESTION]: true,
    [FEATURE_FLAGS.AI_VISION_EXTRACTION]: true,
    [FEATURE_FLAGS.SPLIT_SCREEN_REVIEW]: true,
    [FEATURE_FLAGS.TALLY_XML_EXPORT]: true,
    [FEATURE_FLAGS.EXCEL_EXPORT]: true,
    [FEATURE_FLAGS.DIRECT_UPLOAD]: true,
    [FEATURE_FLAGS.ADVANCED_GSTIN_VALIDATION]: true,
    [FEATURE_FLAGS.BULK_APPROVAL]: false,
    [FEATURE_FLAGS.MULTI_PAGE_PDF]: true,
    [FEATURE_FLAGS.CLOUD_STORAGE_R2]: true,
    [FEATURE_FLAGS.ASYNC_EXTRACTION_QUEUE]: true,
    [FEATURE_FLAGS.GSTR2B_RECONCILIATION]: true,
    [FEATURE_FLAGS.WHATSAPP_INTERACTIVE_BOT]: true,
    [FEATURE_FLAGS.BUSY_ACCOUNTING_EXPORT]: true,
  },
  enterprise: {
    [FEATURE_FLAGS.WHATSAPP_INGESTION]: true,
    [FEATURE_FLAGS.AI_VISION_EXTRACTION]: true,
    [FEATURE_FLAGS.SPLIT_SCREEN_REVIEW]: true,
    [FEATURE_FLAGS.TALLY_XML_EXPORT]: true,
    [FEATURE_FLAGS.EXCEL_EXPORT]: true,
    [FEATURE_FLAGS.DIRECT_UPLOAD]: true,
    [FEATURE_FLAGS.ADVANCED_GSTIN_VALIDATION]: true,
    [FEATURE_FLAGS.BULK_APPROVAL]: true,
    [FEATURE_FLAGS.MULTI_PAGE_PDF]: true,
    [FEATURE_FLAGS.CLOUD_STORAGE_R2]: true,
    [FEATURE_FLAGS.ASYNC_EXTRACTION_QUEUE]: true,
    [FEATURE_FLAGS.GSTR2B_RECONCILIATION]: true,
    [FEATURE_FLAGS.WHATSAPP_INTERACTIVE_BOT]: true,
    [FEATURE_FLAGS.BUSY_ACCOUNTING_EXPORT]: true,
  },
};
