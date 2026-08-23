import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/featureGuard';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { gstr2bService } from '../services/gstr2bReconciliation';

export async function reconciliationRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authenticate);

  // POST /api/v1/reconciliation/process (Reconcile Uploaded GSTR-2B JSON)
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
}
