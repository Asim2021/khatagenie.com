import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/featureGuard';
import { FEATURE_FLAGS, InvoiceStatus, InvoiceType, InvoiceUpdateSchema } from '@khatagenie/types';
import { verifyInvoiceMath, extractPanFromGstin } from '@khatagenie/shared';
import path from 'path';

import { extractionQueue } from '../services/queue';
import { storageService } from '../services/storage';
import { pdfProcessor } from '../services/pdfProcessor';

export async function invoiceRoutes(server: FastifyInstance) {
  // Apply auth globally to all invoice endpoints
  server.addHook('preHandler', authenticate);

  // 1. GET /api/v1/invoices
  server.get('/', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const query = request.query as {
      status?: InvoiceStatus | string;
      clientId?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(Number(query.limit) || 50, 100);
    const offset = Number(query.offset) || 0;

    const where: any = { organizationId: orgId };
    
    if (query.status) {
      if (query.status === InvoiceStatus.NEEDS_REVIEW || query.status === 'NEEDS_REVIEW') {
        where.status = { in: [InvoiceStatus.NEEDS_REVIEW, InvoiceStatus.PROCESSING, InvoiceStatus.EXTRACTION_FAILED] };
      } else {
        where.status = query.status;
      }
    }
    
    if (query.clientId) {
      where.clientId = query.clientId;
    }
    if (query.search) {
      where.OR = [
        { supplierName: { contains: query.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { supplierGstin: { contains: query.search, mode: 'insensitive' } },
        { senderPhone: { contains: query.search } },
      ];
    }

    try {
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            client: { select: { id: true, businessName: true, gstin: true, whatsappPhone: true } },
            reviewedBy: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.invoice.count({ where }),
      ]);

      // Compute status counts for dashboard badges
      const statusCounts = await prisma.invoice.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true },
      });

      const countsMap = statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Combine processing and failed counts into review count for the tab counter
      countsMap['NEEDS_REVIEW_TOTAL'] = 
        (countsMap[InvoiceStatus.NEEDS_REVIEW] || 0) + 
        (countsMap[InvoiceStatus.PROCESSING] || 0) + 
        (countsMap[InvoiceStatus.EXTRACTION_FAILED] || 0);

      return {
        invoices,
        total,
        limit,
        offset,
        counts: countsMap,
      };
    } catch (err: any) {
      console.error(`[Invoices] GET / database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to retrieve invoices from database.',
      });
    }
  });

  // 2. GET /api/v1/invoices/:id
  server.get('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id, organizationId: orgId },
        include: {
          client: true,
          reviewedBy: { select: { id: true, fullName: true, email: true } },
          lineItems: { orderBy: { id: 'asc' } },
        },
      });

      if (!invoice) {
        return reply.status(404).send({
          error: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found.',
        });
      }

      return invoice;
    } catch (err: any) {
      console.error(`[Invoices] GET /:id database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch invoice details.',
      });
    }
  });

  // 3. PATCH /api/v1/invoices/:id (Update, Review, Approve, or Reject)
  server.patch('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const parseResult = InvoiceUpdateSchema.safeParse(request.body);
    if (!parseResult.success) {
      console.error('[Invoices PATCH validation error]:', JSON.stringify(parseResult.error.format(), null, 2), 'Body:', JSON.stringify(request.body, null, 2));
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid invoice update payload.',
        details: parseResult.error.format(),
      });
    }

    const data = parseResult.data;
    const taxableAmount = Number(data.taxableAmount || 0);
    const cgstAmount = Number(data.cgstAmount || 0);
    const sgstAmount = Number(data.sgstAmount || 0);
    const igstAmount = Number(data.igstAmount || 0);
    const cessAmount = Number(data.cessAmount || 0);
    const roundOffAmount = Number(data.roundOffAmount || 0);
    const totalAmount = Number(data.totalAmount || 0);

    const mathCheck = verifyInvoiceMath({
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount,
      roundOffAmount,
      totalAmount,
    });

    const supplierGstin = data.supplierGstin ? data.supplierGstin.toUpperCase() : undefined;
    const supplierPan = supplierGstin ? extractPanFromGstin(supplierGstin) : undefined;
    const isBeingReviewed = data.status === InvoiceStatus.APPROVED || data.status === InvoiceStatus.REJECTED;

    try {
      const existing = await prisma.invoice.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({
          error: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found.',
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (data.lineItems) {
          await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
          if (data.lineItems.length > 0) {
            await tx.invoiceItem.createMany({
              data: data.lineItems.map((item) => ({
                invoiceId: id,
                description: item.description || 'Item',
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
        }

        return tx.invoice.update({
          where: { id },
          data: {
            supplierName: data.supplierName,
            supplierGstin,
            supplierPan,
            supplierAddress: data.supplierAddress,
            buyerGstin: data.buyerGstin,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
            invoiceType: data.invoiceType as any,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            cessAmount,
            roundOffAmount,
            totalAmount,
            isRcm: data.isRcm,
            isMathValid: mathCheck.isValid,
            clientId: data.clientId !== undefined ? data.clientId : undefined,
            status: data.status as any,
            reviewNotes: data.reviewNotes,
            reviewedById: isBeingReviewed ? userId : existing.reviewedById,
            reviewedAt: isBeingReviewed ? new Date() : existing.reviewedAt,
          },
          include: {
            client: true,
            reviewedBy: { select: { id: true, fullName: true } },
            lineItems: true,
          },
        });
      });

      return updated;
    } catch (err: any) {
      console.error(`[Invoices] PATCH /:id database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to update invoice.',
      });
    }
  });

  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/svg+xml',
    'application/pdf',
  ]);

  // 4. POST /api/v1/invoices/upload (Direct File Upload - Feature Flag Gated)
  server.post(
    '/upload',
    { preHandler: [requireFeature(FEATURE_FLAGS.DIRECT_UPLOAD)] },
    async (request, reply) => {
      const orgId = request.user!.organizationId;
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'FILE_REQUIRED', message: 'No file uploaded.' });
      }

      if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
        return reply.status(415).send({
          error: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Only JPEG, PNG, WebP, HEIC images and PDF documents are allowed for invoice processing.',
        });
      }

      // Extract clientId and senderPhone from multipart fields if provided
      let clientId: string | null = null;
      let senderPhone = 'DIRECT_WEB_UPLOAD';

      const fields = data.fields as any;
      if (fields) {
        if (fields.clientId) {
          const val = fields.clientId.value || fields.clientId;
          if (val && typeof val === 'string' && val.trim() !== '') {
            clientId = val.trim();
          }
        }
        if (fields.senderPhone) {
          const val = fields.senderPhone.value || fields.senderPhone;
          if (val && typeof val === 'string' && val.trim() !== '') {
            senderPhone = val.trim();
          }
        }
      }

      // If clientId was passed, verify it belongs to this organization
      if (clientId) {
        const clientExists = await prisma.client.findFirst({
          where: { id: clientId, organizationId: orgId },
        });
        if (!clientExists) {
          clientId = null;
        } else if (clientExists.whatsappPhone) {
          senderPhone = clientExists.whatsappPhone;
        }
      }

      const buffer = await data.toBuffer();
      const uploadResult = await storageService.saveFile(data.filename, buffer, data.mimetype);
      const fullDiskPath = path.join(process.cwd(), uploadResult.fileUrl);

      // Process multi-page document info
      const docInfo = await pdfProcessor.processDocument(
        fullDiskPath,
        data.mimetype,
        uploadResult.fileUrl
      );

      // Create invoice record
      try {
        const invoice = await prisma.invoice.create({
          data: {
            organizationId: orgId,
            clientId,
            senderPhone,
            fileUrl: uploadResult.fileUrl,
            fileMimeType: data.mimetype,
            fileSizeBytes: uploadResult.sizeBytes,
            status: InvoiceStatus.PROCESSING,
          },
        });

        // Enqueue to background worker queue
        extractionQueue.enqueue(invoice.id, fullDiskPath, senderPhone);

        return {
          message: 'File uploaded successfully. AI OCR extraction initiated.',
          invoiceId: invoice.id,
          fileUrl: uploadResult.fileUrl,
          pageCount: docInfo.pageCount,
        };
      } catch (err: any) {
        console.error(`[Invoices] Upload database save error: ${err.message}`);
        return reply.status(500).send({
          error: 'DATABASE_ERROR',
          message: 'Failed to record uploaded invoice.',
        });
      }
    }
  );

  // 5. DELETE /api/v1/invoices/:id (Delete Single Invoice)
  server.delete('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!invoice) {
        return reply.status(404).send({
          error: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found or already deleted.',
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoice.delete({ where: { id } });
      });

      // Cleanup physical file from storage
      if (invoice.fileUrl) {
        await storageService.deleteFile(invoice.fileUrl);
      }

      return {
        message: 'Invoice and associated line items deleted successfully.',
        invoiceId: id,
      };
    } catch (err: any) {
      console.error(`[Invoices] DELETE /:id error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to delete invoice.',
      });
    }
  });

  // 6. POST /api/v1/invoices/bulk-delete (Bulk Delete Invoices)
  server.post('/bulk-delete', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { invoiceIds } = request.body as { invoiceIds: string[] };

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'invoiceIds array is required.',
      });
    }

    try {
      // Find matching invoices to delete
      const invoices = await prisma.invoice.findMany({
        where: { id: { in: invoiceIds }, organizationId: orgId },
        select: { id: true, fileUrl: true },
      });

      if (invoices.length === 0) {
        return { message: 'No matching invoices found to delete.', count: 0 };
      }

      const validIds = invoices.map((i) => i.id);

      await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: validIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: validIds } } });
      });

      // Cleanup physical files
      for (const inv of invoices) {
        if (inv.fileUrl) {
          await storageService.deleteFile(inv.fileUrl);
        }
      }

      return {
        message: `Successfully deleted ${validIds.length} invoice(s).`,
        count: validIds.length,
      };
    } catch (err: any) {
      console.error(`[Invoices] Bulk delete error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to delete invoices in bulk.',
      });
    }
  });

  // 7. POST /api/v1/invoices/bulk-status (Bulk Status Update - e.g. Approve / Reject)
  server.post('/bulk-status', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const userId = request.user!.userId;
    const { invoiceIds, status } = request.body as {
      invoiceIds: string[];
      status: InvoiceStatus;
    };

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0 || !status) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'invoiceIds array and target status are required.',
      });
    }

    try {
      const isReviewing = status === InvoiceStatus.APPROVED || status === InvoiceStatus.REJECTED;

      const result = await prisma.invoice.updateMany({
        where: { id: { in: invoiceIds }, organizationId: orgId },
        data: {
          status: status as any,
          reviewedById: isReviewing ? userId : undefined,
          reviewedAt: isReviewing ? new Date() : undefined,
        },
      });

      return {
        message: `Successfully updated ${result.count} invoice(s) to ${status}.`,
        count: result.count,
      };
    } catch (err: any) {
      console.error(`[Invoices] Bulk status update error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to update invoice statuses in bulk.',
      });
    }
  });

  // 8. POST /api/v1/invoices/:id/retry-ocr (Re-trigger OCR Extraction)
  server.post('/:id/retry-ocr', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    try {
      const invoice = await prisma.invoice.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!invoice) {
        return reply.status(404).send({
          error: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found.',
        });
      }

      await prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PROCESSING,
          errorMessage: null,
        },
      });

      const fullDiskPath = path.join(process.cwd(), invoice.fileUrl);
      extractionQueue.enqueue(invoice.id, fullDiskPath, invoice.senderPhone || undefined);

      return {
        message: 'AI OCR Extraction re-queued successfully.',
        invoiceId: id,
      };
    } catch (err: any) {
      console.error(`[Invoices] Retry OCR error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to retry OCR extraction.',
      });
    }
  });
}
