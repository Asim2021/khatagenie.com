import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/featureGuard';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { gstr2bService } from '../services/gstr2bReconciliation';

export async function reconciliationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // 1. POST /api/v1/reconciliation/process (Feature Flag Gated)
  server.post(
    '/process',
    { preHandler: [requireFeature(FEATURE_FLAGS.GSTR2B_RECONCILIATION)] },
    async (request, reply) => {
      const orgId = request.user!.organizationId;
      const body = request.body as any;

      if (!body) {
        return reply.status(400).send({
          error: 'PAYLOAD_REQUIRED',
          message: 'Please provide GSTR-2B JSON data to reconcile.',
        });
      }

      const records = gstr2bService.parseGstr2bJson(body);
      const summary = await gstr2bService.reconcile(orgId, records);

      return summary;
    }
  );

  // 2. GET /api/v1/reconciliation/sample (Sample GSTR-2B for instant demo)
  server.get(
    '/sample',
    { preHandler: [requireFeature(FEATURE_FLAGS.GSTR2B_RECONCILIATION)] },
    async (request, reply) => {
      const orgId = request.user!.organizationId;

      const sampleGstr2b = {
        data: {
          fp: '082026',
          docdata: {
            b2b: [
              {
                ctin: '07AAAFB1234F1Z3',
                cname: 'Shree Balaji Industrial Hardware',
                inv: [
                  {
                    inum: 'SBI-2026/0412',
                    idt: '2026-08-20',
                    val: 21240.0,
                    itcavl: 'Y',
                    items: [
                      {
                        itm_det: {
                          txval: 18000.0,
                          camt: 1620.0,
                          samt: 1620.0,
                          iamt: 0.0,
                          csamt: 0.0,
                        },
                      },
                    ],
                  },
                ],
              },
              {
                ctin: '06EEEFF5555E1Z9',
                cname: 'Cybertronics Hardware Gurgaon',
                inv: [
                  {
                    inum: 'DEL-HGN-4412',
                    idt: '2026-08-20',
                    val: 29500.0,
                    itcavl: 'Y',
                    items: [
                      {
                        itm_det: {
                          txval: 25000.0,
                          camt: 0.0,
                          samt: 0.0,
                          iamt: 4500.0,
                          csamt: 0.0,
                        },
                      },
                    ],
                  },
                ],
              },
              {
                ctin: '07KLLMN8899K1Z5',
                cname: 'Kailash Offset Printers Okhla',
                inv: [
                  {
                    inum: 'KOP-8891',
                    idt: '2026-08-18',
                    val: 8850.0,
                    itcavl: 'Y',
                    items: [
                      {
                        itm_det: {
                          txval: 7500.0,
                          camt: 675.0,
                          samt: 675.0,
                          iamt: 0.0,
                          csamt: 0.0,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      const records = gstr2bService.parseGstr2bJson(sampleGstr2b);
      const summary = await gstr2bService.reconcile(orgId, records);

      return summary;
    }
  );
}
