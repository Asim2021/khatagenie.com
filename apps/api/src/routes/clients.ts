import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { ClientSchema } from '@khatagenie/types';
import { extractPanFromGstin } from '@khatagenie/shared';

export async function clientRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // 1. GET /api/v1/clients (List Clients)
  server.get('/', async (request, reply) => {
    const orgId = request.user!.organizationId;
    try {
      const clients = await prisma.client.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { invoices: true } },
        },
        orderBy: { businessName: 'asc' },
      });

      return clients;
    } catch (err: any) {
      console.error(`[Clients] GET / database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch clients from database.',
      });
    }
  });

  // 2. POST /api/v1/clients (Create Client)
  server.post('/', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const parseResult = ClientSchema.omit({ id: true, organizationId: true }).safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid client data. Please check business name and phone.',
        details: parseResult.error.format(),
      });
    }

    const data = parseResult.data;
    // Format phone: remove any spaces or '+' signs
    const cleanPhone = data.whatsappPhone.replace(/[^0-9]/g, '');
    const pan = data.gstin ? extractPanFromGstin(data.gstin) : data.pan || null;

    try {
      const existing = await prisma.client.findFirst({
        where: { organizationId: orgId, whatsappPhone: cleanPhone },
      });

      if (existing) {
        return reply.status(409).send({
          error: 'PHONE_ALREADY_EXISTS',
          message: `A client with WhatsApp phone +${cleanPhone} already exists.`,
        });
      }

      const client = await prisma.client.create({
        data: {
          organizationId: orgId,
          businessName: data.businessName,
          tradeName: data.tradeName || null,
          gstin: data.gstin ? data.gstin.toUpperCase() : null,
          pan,
          contactPerson: data.contactPerson || null,
          whatsappPhone: cleanPhone,
          tallyLedgerName: data.tallyLedgerName || `${data.businessName} - Purchase A/c`,
          isActive: data.isActive ?? true,
        },
      });

      return reply.status(201).send(client);
    } catch (err: any) {
      console.error(`[Clients] POST / database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to create client.',
      });
    }
  });

  // 3. PATCH /api/v1/clients/:id (Update Client)
  server.patch('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const pan = data.gstin ? extractPanFromGstin(data.gstin) : data.pan;

    try {
      const existing = await prisma.client.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'CLIENT_NOT_FOUND', message: 'Client not found.' });
      }

      const updated = await prisma.client.update({
        where: { id },
        data: {
          businessName: data.businessName,
          tradeName: data.tradeName,
          gstin: data.gstin ? data.gstin.toUpperCase() : undefined,
          pan,
          contactPerson: data.contactPerson,
          whatsappPhone: data.whatsappPhone ? data.whatsappPhone.replace(/[^0-9]/g, '') : undefined,
          tallyLedgerName: data.tallyLedgerName,
          isActive: data.isActive,
        },
      });

      return updated;
    } catch (err: any) {
      console.error(`[Clients] PATCH /:id database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to update client.',
      });
    }
  });

  // 4. DELETE /api/v1/clients/:id (Delete Client)
  server.delete('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    try {
      const existing = await prisma.client.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'CLIENT_NOT_FOUND', message: 'Client not found.' });
      }

      await prisma.client.delete({
        where: { id },
      });
      return { success: true, message: 'Client removed successfully.' };
    } catch (err: any) {
      console.error(`[Clients] DELETE /:id database error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Failed to delete client.',
      });
    }
  });
}
