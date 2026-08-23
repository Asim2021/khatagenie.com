import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/featureGuard';
import { FEATURE_FLAGS, InvoiceStatus } from '@khatagenie/types';
import { tallyExporter } from '../services/tallyExporter';
import { excelExporter } from '../services/excelExporter';

export async function exportRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // 1. GET /api/v1/exports/tally (Download Tally Prime XML - Feature Flag Gated)
  server.get(
    '/tally',
    { preHandler: [requireFeature(FEATURE_FLAGS.TALLY_XML_EXPORT)] },
    async (request, reply) => {
      const orgId = request.user!.organizationId;
      const query = request.query as { invoiceIds?: string; clientId?: string };

      const where: any = {
        organizationId: orgId,
        status: InvoiceStatus.APPROVED,
      };

      if (query.invoiceIds) {
        const ids = query.invoiceIds.split(',').filter(Boolean);
        where.id = { in: ids };
      }
      if (query.clientId) {
        where.clientId = query.clientId;
      }

      try {
        const invoices = await prisma.invoice.findMany({
          where,
          include: { client: true },
          orderBy: { invoiceDate: 'asc' },
        });

        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        const xmlString = tallyExporter.generatePurchaseVouchersXml(
          invoices,
          org?.name || 'KhataGenie Client'
        );

        // Mark invoices as EXPORTED
        if (invoices.length > 0) {
          const invoiceIds = invoices.map((i) => i.id);
          await prisma.invoice.updateMany({
            where: { id: { in: invoiceIds } },
            data: { status: InvoiceStatus.EXPORTED, exportedAt: new Date() },
          });
        }

        reply.header('Content-Type', 'application/xml');
        reply.header('Content-Disposition', `attachment; filename="tally_vouchers_${Date.now()}.xml"`);
        return reply.send(xmlString);
      } catch (err: any) {
        console.error(`[Exports] Tally export database error: ${err.message}`);
        return reply.status(500).send({
          error: 'EXPORT_FAILED',
          message: 'Failed to generate Tally XML export.',
        });
      }
    }
  );

  // 2. GET /api/v1/exports/excel (Download Excel Purchase Register - Feature Flag Gated)
  server.get(
    '/excel',
    { preHandler: [requireFeature(FEATURE_FLAGS.EXCEL_EXPORT)] },
    async (request, reply) => {
      const orgId = request.user!.organizationId;
      const query = request.query as { invoiceIds?: string; status?: InvoiceStatus; clientId?: string };

      const where: any = { organizationId: orgId };
      if (query.invoiceIds) {
        const ids = query.invoiceIds.split(',').filter(Boolean);
        where.id = { in: ids };
      }
      if (query.status) {
        where.status = query.status;
      }
      if (query.clientId) {
        where.clientId = query.clientId;
      }

      try {
        const invoices = await prisma.invoice.findMany({
          where,
          include: { client: true },
          orderBy: { invoiceDate: 'desc' },
        });

        const buffer = excelExporter.generatePurchaseRegisterExcel(invoices);

        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', `attachment; filename="gst_purchase_register_${Date.now()}.xlsx"`);
        return reply.send(buffer);
      } catch (err: any) {
        console.error(`[Exports] Excel export database error: ${err.message}`);
        return reply.status(500).send({
          error: 'EXPORT_FAILED',
          message: 'Failed to generate Excel export.',
        });
      }
    }
  );
}
