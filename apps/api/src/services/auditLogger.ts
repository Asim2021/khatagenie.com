import { prisma } from '../lib/prisma';

export const AUDIT_ACTIONS = {
  UPLOADED: 'UPLOADED',
  OCR_PROCESSED: 'OCR_PROCESSED',
  OCR_FAILED: 'OCR_FAILED',
  UPDATED: 'UPDATED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RE_REVIEWED: 'RE_REVIEWED',
  EXPORTED: 'EXPORTED',
  OCR_RETRIED: 'OCR_RETRIED',
} as const;

export type AuditActionType = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface LogInvoiceActionParams {
  invoiceId: string;
  userId?: string | null;
  action: AuditActionType | string;
  details?: string | null;
  metadata?: any;
}

export class AuditLogger {
  /**
   * Records an audit log entry for an invoice.
   * Can accept either the global prisma instance or a transaction client `tx`.
   */
  public async log(
    params: LogInvoiceActionParams,
    txClient?: any
  ): Promise<void> {
    const client = txClient || prisma;
    try {
      await (client.invoiceAuditLog as any).create({
        data: {
          invoiceId: params.invoiceId,
          userId: params.userId || null,
          action: params.action,
          details: params.details || null,
          metadata: params.metadata || undefined,
        },
      });
    } catch (err: any) {
      console.error(`[AuditLogger] Failed to write audit log for invoice ${params.invoiceId}:`, err.message);
    }
  }
}

export const auditLogger = new AuditLogger();
