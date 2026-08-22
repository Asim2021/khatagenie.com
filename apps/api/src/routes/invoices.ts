import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/featureGuard';
import { FEATURE_FLAGS, InvoiceStatus, InvoiceType, InvoiceUpdateSchema } from '@khatagenie/types';
import { verifyInvoiceMath, extractPanFromGstin } from '@khatagenie/shared';
import { visionService } from '../services/vision';
import fs from 'fs';
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
      status?: InvoiceStatus;
      clientId?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(Number(query.limit) || 50, 100);
    const offset = Number(query.offset) || 0;

    const where: any = { organizationId: orgId };
    if (query.status) {
      where.status = query.status;
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

    return {
      invoices,
      total,
      limit,
      offset,
      counts: countsMap,
    };
  });

  // 2. GET /api/v1/invoices/:id
  server.get('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId },
      include: {
        client: true,
        reviewedBy: { select: { id: true, fullName: true, email: true } },
        lineItems: { orderBy: { id: 'asc' } },
      },
    });

    if (!invoice) {
      return reply.status(404).send({ error: 'INVOICE_NOT_FOUND', message: 'Invoice not found.' });
    }

    return invoice;
  });

  // 3. PATCH /api/v1/invoices/:id (Update, Review, Approve, or Reject)
  server.patch('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const parseResult = InvoiceUpdateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid invoice update payload.',
        details: parseResult.error.format(),
      });
    }

    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'INVOICE_NOT_FOUND', message: 'Invoice not found.' });
    }

    const data = parseResult.data;

    // Recalculate math parity
    const taxableAmount = data.taxableAmount !== undefined ? data.taxableAmount : Number(existing.taxableAmount || 0);
    const cgstAmount = data.cgstAmount !== undefined ? data.cgstAmount : Number(existing.cgstAmount || 0);
    const sgstAmount = data.sgstAmount !== undefined ? data.sgstAmount : Number(existing.sgstAmount || 0);
    const igstAmount = data.igstAmount !== undefined ? data.igstAmount : Number(existing.igstAmount || 0);
    const cessAmount = data.cessAmount !== undefined ? data.cessAmount : Number(existing.cessAmount || 0);
    const roundOffAmount = data.roundOffAmount !== undefined ? data.roundOffAmount : Number(existing.roundOffAmount || 0);
    const totalAmount = data.totalAmount !== undefined ? data.totalAmount : Number(existing.totalAmount || 0);

    const mathCheck = verifyInvoiceMath({
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount,
      roundOffAmount,
      totalAmount,
    });

    const supplierGstin = data.supplierGstin !== undefined ? data.supplierGstin : existing.supplierGstin;
    const supplierPan = supplierGstin ? extractPanFromGstin(supplierGstin) : existing.supplierPan;

    const isBeingReviewed = data.status === InvoiceStatus.APPROVED || data.status === InvoiceStatus.REJECTED;

    const updated = await prisma.$transaction(async (tx) => {
      // Update line items if provided
      if (data.lineItems) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        if (data.lineItems.length > 0) {
          await tx.invoiceItem.createMany({
            data: data.lineItems.map((item) => ({
              invoiceId: id,
              description: item.description,
              hsnCode: item.hsnCode || null,
              quantity: item.quantity || null,
              unit: item.unit || null,
              unitPrice: item.unitPrice || null,
              taxableAmount: item.taxableAmount,
              gstRate: item.gstRate,
              cgstAmount: item.cgstAmount || null,
              sgstAmount: item.sgstAmount || null,
              igstAmount: item.igstAmount || null,
              totalAmount: item.totalAmount,
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
  });

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
      const invoice = await prisma.invoice.create({
        data: {
          organizationId: orgId,
          senderPhone: 'DIRECT_WEB_UPLOAD',
          fileUrl: uploadResult.fileUrl,
          fileMimeType: data.mimetype,
          fileSizeBytes: uploadResult.sizeBytes,
          status: InvoiceStatus.PROCESSING,
        },
      });

      // Enqueue to background worker queue
      extractionQueue.enqueue(invoice.id, fullDiskPath);

      return {
        message: 'File uploaded successfully. Extraction initiated.',
        invoiceId: invoice.id,
        fileUrl: uploadResult.fileUrl,
        pageCount: docInfo.pageCount,
      };
    }
  );
}

