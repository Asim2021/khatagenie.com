import { visionService } from './vision';
import { prisma } from '../lib/prisma';
import { InvoiceStatus, InvoiceType } from '@prisma/client';
import { extractPanFromGstin } from '@khatagenie/shared';
import { whatsappService } from './whatsapp';
import { auditLogger, AUDIT_ACTIONS } from './auditLogger';

export interface ExtractionJob {
  id: string;
  invoiceId: string;
  filePath: string;
  senderPhone?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

export class ExtractionQueue {
  private queue: ExtractionJob[] = [];
  private activeCount = 0;
  private maxConcurrency = 3;

  /**
   * Enqueues an invoice extraction job
   */
  public enqueue(invoiceId: string, filePath: string, senderPhone?: string): void {
    const job: ExtractionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceId,
      filePath,
      senderPhone,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.processNext();
  }

  /**
   * Processes the next job in the queue if concurrency limit allows
   */
  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeCount++;
    job.attempts++;

    try {
      await this.executeJob(job);
    } catch (err: any) {
      console.error(`[Queue] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, err);

      if (job.attempts < job.maxAttempts) {
        const delayMs = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, delayMs);
      } else {
        // Mark invoice as failed
        await prisma.invoice.update({
          where: { id: job.invoiceId },
          data: {
            status: InvoiceStatus.EXTRACTION_FAILED,
            errorMessage: err.message || 'Vision AI extraction failed after multiple retries.',
          },
        });

        await auditLogger.log({
          invoiceId: job.invoiceId,
          action: AUDIT_ACTIONS.OCR_FAILED,
          details: `Vision AI extraction failed: ${err.message || 'Unknown error'}.`,
        });
      }
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }

  /**
   * Executes the actual Vision AI extraction and DB persistence
   */
  private async executeJob(job: ExtractionJob): Promise<void> {
    const { extraction, isMathValid, rawResponse } = await visionService.extractInvoiceData(job.filePath, true);
    const supplierPan = extractPanFromGstin(extraction.supplierGstin);

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: job.invoiceId },
        data: {
          status: InvoiceStatus.NEEDS_REVIEW,
          supplierName: extraction.supplierName,
          supplierGstin: extraction.supplierGstin,
          supplierPan,
          supplierAddress: extraction.supplierAddress,
          buyerGstin: extraction.buyerGstin,
          invoiceNumber: extraction.invoiceNumber,
          invoiceDate: extraction.invoiceDate ? new Date(extraction.invoiceDate) : null,
          dueDate: extraction.dueDate ? new Date(extraction.dueDate) : null,
          invoiceType: (extraction.invoiceType as any) || InvoiceType.B2B_TAX_INVOICE,
          taxableAmount: extraction.taxableAmount,
          cgstAmount: extraction.cgstAmount,
          sgstAmount: extraction.sgstAmount,
          igstAmount: extraction.igstAmount,
          cessAmount: extraction.cessAmount,
          roundOffAmount: extraction.roundOffAmount,
          totalAmount: extraction.totalAmount,
          isRcm: extraction.isReverseCharge,
          isMathValid,
          confidenceScore: extraction.confidenceScore,
          rawAiResponse: rawResponse,
        },
      });

      // Clear any prior line items before re-inserting
      await tx.invoiceItem.deleteMany({ where: { invoiceId: job.invoiceId } });

      if (extraction.lineItems && extraction.lineItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: extraction.lineItems.map((item) => ({
            invoiceId: job.invoiceId,
            description: item.description || 'Line Item',
            hsnCode: item.hsnCode || null,
            quantity: item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : null,
            unit: item.unit || null,
            unitPrice: item.unitPrice !== null && item.unitPrice !== undefined ? Number(item.unitPrice) : null,
            taxableAmount: Number(item.taxableAmount || 0),
            gstRate: Number(item.gstRate || 0),
            cgstAmount: item.cgstAmount !== null && item.cgstAmount !== undefined ? Number(item.cgstAmount) : null,
            sgstAmount: item.sgstAmount !== null && item.sgstAmount !== undefined ? Number(item.sgstAmount) : null,
            igstAmount: item.igstAmount !== null && item.igstAmount !== undefined ? Number(item.igstAmount) : null,
            totalAmount: Number(item.totalAmount || 0),
          })),
        });
      }

      await auditLogger.log({
        invoiceId: job.invoiceId,
        action: AUDIT_ACTIONS.OCR_PROCESSED,
        details: `Gemini Flash 3.7 AI OCR extraction complete. Confidence: ${Math.round((extraction.confidenceScore || 0.85) * 100)}%, Math: ${isMathValid ? 'Balanced' : 'Mismatch detected'}. Extracted total: ₹${(extraction.totalAmount || 0).toFixed(2)}.`,
      }, tx);
    });

    // If invoice came from WhatsApp, send automated confirmation
    if (job.senderPhone && job.senderPhone !== 'DIRECT_WEB_UPLOAD') {
      const invDisplay = extraction.invoiceNumber ? `#${extraction.invoiceNumber}` : '';
      const amountDisplay = extraction.totalAmount ? `₹${extraction.totalAmount.toFixed(2)}` : '';
      const replyMessage = `🙏 Namaste! KhataGenie received your bill ${invDisplay} for ${amountDisplay}.\n\nIt has been digitized and forwarded to your CA for review & filing.`;
      await whatsappService.sendTextMessage(job.senderPhone, replyMessage);
    }
  }

  public getQueueStatus() {
    return {
      queuedJobs: this.queue.length,
      activeJobs: this.activeCount,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

export const extractionQueue = new ExtractionQueue();
