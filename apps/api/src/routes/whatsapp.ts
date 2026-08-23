import { FastifyInstance } from 'fastify';
import { whatsappService } from '../services/whatsapp';

export async function whatsappRoutes(server: FastifyInstance) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'khatagenie_verify_token_2026';

  // 1. GET /api/v1/whatsapp/status (Live Connection Health Probe)
  server.get('/status', async (request, reply) => {
    const status = whatsappService.getConnectionStatus();
    return reply.status(200).send(status);
  });

  // 2. GET /api/v1/whatsapp/webhook (Meta Webhook Verification)
  server.get('/webhook', async (request, reply) => {
    const query = request.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp Webhook verified successfully by Meta!');
      return reply.status(200).send(challenge);
    }

    return reply.status(403).send('Forbidden: Token mismatch');
  });

  // 3. POST /api/v1/whatsapp/webhook (Meta Incoming Event Receiver)
  server.post('/webhook', async (request, reply) => {
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {});

    // Validate HMAC-SHA256 signature
    const isValid = whatsappService.verifySignature(rawBody, signature);
    if (!isValid) {
      return reply.status(401).send({
        error: 'INVALID_SIGNATURE',
        message: 'Meta webhook HMAC-SHA256 signature verification failed.',
      });
    }

    // Record live event timestamp
    whatsappService.recordWebhookEvent();

    const body = request.body as any;

    // Acknowledge receipt immediately to Meta to prevent timeout retries
    reply.status(200).send({ status: 'EVENT_RECEIVED' });

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message) {
        return;
      }

      const from = message.from; // Sender phone number
      const messageId = message.id;

      // Handle Image message
      if (message.type === 'image' && message.image) {
        const mediaId = message.image.id;
        const mimeType = message.image.mime_type || 'image/jpeg';
        const caption = message.image.caption;

        // Async processing outside request lifecycle
        whatsappService.processIncomingMedia({
          from,
          messageId,
          mediaId,
          mimeType,
          caption,
        }).catch((err) => {
          console.error(`Error processing WhatsApp image message ${messageId}:`, err);
        });
      }

      // Handle Document message (e.g. PDF bills)
      else if (message.type === 'document' && message.document) {
        const mediaId = message.document.id;
        const mimeType = message.document.mime_type || 'application/pdf';
        const caption = message.document.caption;

        whatsappService.processIncomingMedia({
          from,
          messageId,
          mediaId,
          mimeType,
          caption,
        }).catch((err) => {
          console.error(`Error processing WhatsApp document message ${messageId}:`, err);
        });
      }

      // Handle Text message fallback
      else if (message.type === 'text') {
        const replyText = `🙏 Namaste from KhataGenie!\n\nPlease send a clear photo or PDF of your bill/receipt, and our AI will automatically digitize it for your CA.`;
        whatsappService.sendTextMessage(from, replyText).catch(() => {});
      }
    } catch (err) {
      console.error('Error handling incoming WhatsApp event:', err);
    }
  });
}
