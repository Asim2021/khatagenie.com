import { FastifyInstance } from 'fastify';
import { prisma, isDatabaseOnline } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { ClientSchema } from '@khatagenie/types';
import { extractPanFromGstin } from '@khatagenie/shared';

// Resilient in-memory store for offline/local development mode
const inMemoryClients: any[] = [
  {
    id: 'cli-01',
    organizationId: 'org_bansal_ca',
    businessName: 'Sharma Electronics & Appliances',
    tradeName: 'Sharma Electronics',
    gstin: '07BBCDE2222B1Z8',
    pan: 'BBCDE2222B',
    contactPerson: 'Mukesh Sharma',
    whatsappPhone: '919877665544',
    tallyLedgerName: 'Sharma Electronics - Purchase A/c',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { invoices: 8 },
  },
  {
    id: 'cli-02',
    organizationId: 'org_bansal_ca',
    businessName: 'Aggarwal Traders',
    tradeName: 'Aggarwal Paper & Stationery',
    gstin: '07AABCA1111A1Z0',
    pan: 'AABCA1111A',
    contactPerson: 'Suresh Aggarwal',
    whatsappPhone: '919811223344',
    tallyLedgerName: 'Aggarwal Traders - Purchase A/c',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { invoices: 14 },
  },
  {
    id: 'cli-03',
    organizationId: 'org_bansal_ca',
    businessName: 'Gupta Sweets & Namkeen',
    tradeName: 'Gupta Foods',
    gstin: '07AAACH1234A1Z0',
    pan: 'AAACH1234A',
    contactPerson: 'Ramesh Gupta',
    whatsappPhone: '919891002233',
    tallyLedgerName: 'Gupta Sweets - Purchase A/c',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { invoices: 5 },
  },
];

export async function clientRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // 1. GET /api/v1/clients (List Clients)
  server.get('/', async (request, reply) => {
    const orgId = request.user!.organizationId;
    if (await isDatabaseOnline()) {
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
        console.warn(`[Clients] Database query notice (${err.message}). Returning memory MSME clients.`);
      }
    }
    return inMemoryClients.filter((c) => c.organizationId === orgId || c.organizationId === 'org_bansal_ca');
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

    if (await isDatabaseOnline()) {
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
        console.warn(`[Clients] DB create notice (${err.message}). Saving to resilient memory store.`);
      }
    }

    // In-memory store fallback
    const existingMemory = inMemoryClients.find(
      (c) => (c.organizationId === orgId || c.organizationId === 'org_bansal_ca') && c.whatsappPhone === cleanPhone
    );

    if (existingMemory) {
      return reply.status(409).send({
        error: 'PHONE_ALREADY_EXISTS',
        message: `A client with WhatsApp phone +${cleanPhone} already exists.`,
      });
    }

    const newClient = {
      id: `cli-${Date.now()}`,
      organizationId: orgId,
      businessName: data.businessName,
      tradeName: data.tradeName || null,
      gstin: data.gstin ? data.gstin.toUpperCase() : null,
      pan,
      contactPerson: data.contactPerson || null,
      whatsappPhone: cleanPhone,
      tallyLedgerName: data.tallyLedgerName || `${data.businessName} - Purchase A/c`,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { invoices: 0 },
    };

    inMemoryClients.unshift(newClient);
    return reply.status(201).send(newClient);
  });

  // 3. PATCH /api/v1/clients/:id (Update Client)
  server.patch('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const pan = data.gstin ? extractPanFromGstin(data.gstin) : data.pan;

    if (await isDatabaseOnline()) {
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
        console.warn(`[Clients] DB patch notice (${err.message}). Updating memory client.`);
      }
    }

    const index = inMemoryClients.findIndex((c) => c.id === id);
    if (index === -1) {
      return reply.status(404).send({ error: 'CLIENT_NOT_FOUND', message: 'Client not found.' });
    }

    inMemoryClients[index] = {
      ...inMemoryClients[index],
      ...data,
      pan: pan || inMemoryClients[index].pan,
      updatedAt: new Date().toISOString(),
    };

    return inMemoryClients[index];
  });

  // 4. DELETE /api/v1/clients/:id (Delete Client)
  server.delete('/:id', async (request, reply) => {
    const orgId = request.user!.organizationId;
    const { id } = request.params as { id: string };

    if (await isDatabaseOnline()) {
      try {
        await prisma.client.delete({
          where: { id },
        });
        return { success: true, message: 'Client removed successfully.' };
      } catch (err: any) {
        console.warn(`[Clients] DB delete notice (${err.message}). Deleting from memory.`);
      }
    }

    const index = inMemoryClients.findIndex((c) => c.id === id);
    if (index !== -1) {
      inMemoryClients.splice(index, 1);
      return { success: true, message: 'Client removed successfully.' };
    }
    return { success: true, message: 'Client removed.' };
  });
}
