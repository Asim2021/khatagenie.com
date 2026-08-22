import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { ClientSchema } from '@khatagenie/types';
import { extractPanFromGstin } from '@khatagenie/shared';

export async function clientRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // 1. GET /api/v1/clients
  server.get('/', async (request, reply) => {
    const orgId = request.user!.organizationId;

    const clients = await prisma.client.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { invoices: true } },
      },
      orderBy: { businessName: 'asc' },
    });

    return clients;
  });

  // 2. POST /api/v1/clients
  server.post('/', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const parseResult = ClientSchema.omit({ id: true, organizationId: true }).safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid client data.',
        details: parseResult.error.format(),
      });
    }

    const data = parseResult.data;
    // Format phone: remove any spaces or '+' signs
    const cleanPhone = data.whatsappPhone.replace(/[^0-9]/g, '');

    const existing = await prisma.client.findFirst({
      where: { organizationId: orgId, whatsappPhone: cleanPhone },
    });

    if (existing) {
      return reply.status(409).send({
        error: 'PHONE_ALREADY_EXISTS',
        message: `A client with WhatsApp phone +${cleanPhone} already exists.`,
      });
    }

    const pan = data.gstin ? extractPanFromGstin(data.gstin) : data.pan || null;

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

    return client;
  });

  // 3. PATCH /api/v1/clients/:id
  server.patch('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    const existing = await prisma.client.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'CLIENT_NOT_FOUND', message: 'Client not found.' });
    }

    const data = request.body as any;
    const pan = data.gstin ? extractPanFromGstin(data.gstin) : data.pan;

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
  });
}
