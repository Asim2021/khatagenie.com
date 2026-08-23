import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { authRoutes } from './routes/auth';
import { invoiceRoutes } from './routes/invoices';
import { clientRoutes } from './routes/clients';
import { exportRoutes } from './routes/exports';
import { whatsappRoutes } from './routes/whatsapp';
import { reconciliationRoutes } from './routes/reconciliation';
import { prisma } from './lib/prisma';
import { env } from './lib/env';

const server = fastify({
  logger: {
    level: env.LOG_LEVEL || 'info',
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function buildServer() {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Security & Core Plugins
  const allowedOrigins =
    env.NODE_ENV === 'production' && process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : true;

  await server.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', '*'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await server.register(rateLimit, {
    max: 150,
    timeWindow: '1 minute',
    allowList: (req) => {
      // Exclude internal health probes and Meta WhatsApp webhooks from rate limiting
      return (
        req.url === '/health' ||
        req.url === '/ready' ||
        req.url.startsWith('/api/v1/whatsapp/webhook')
      );
    },
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please retry after a moment.',
    }),
  });

  await server.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  });

  // Allow empty body with Content-Type: application/json gracefully
  server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const raw = typeof body === 'string' ? body : body.toString('utf8');
    if (!raw || raw.trim().length === 0) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(raw));
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  await server.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await server.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB max
    },
  });

  // Serve uploaded images statically with nosniff and safe cache headers
  await server.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  // 2. Health & Readiness check routes
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'khatagenie-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  server.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      reply.status(503);
      return {
        status: 'not_ready',
        database: 'disconnected',
        error: err.message,
      };
    }
  });

  // 3. Register API Modules
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
  await server.register(clientRoutes, { prefix: '/api/v1/clients' });
  await server.register(exportRoutes, { prefix: '/api/v1/exports' });
  await server.register(whatsappRoutes, { prefix: '/api/v1/whatsapp' });
  await server.register(reconciliationRoutes, { prefix: '/api/v1/reconciliation' });

  // 4. Global Error Handler (Sanitizes stack traces in production)
  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    const isProd = env.NODE_ENV === 'production';

    reply.status(statusCode).send({
      error: error.name || 'INTERNAL_SERVER_ERROR',
      message:
        statusCode >= 500 && isProd
          ? 'An internal server error occurred. Please contact support.'
          : error.message || 'An unexpected error occurred.',
    });
  });

  return server;
}

const PORT = Number(env.PORT) || 4000;
const HOST = env.HOST || '0.0.0.0';

if (require.main === module) {
  buildServer()
    .then((app) => {
      app.listen({ port: PORT, host: HOST }, (err, address) => {
        if (err) {
          app.log.error(err);
          process.exit(1);
        }
        app.log.info(`🚀 KhataGenie Fastify Server running at ${address}`);
        app.log.info(`📊 Health check available at ${address}/health`);
      });

      // Graceful shutdown handling
      const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
      signals.forEach((sig) => {
        process.on(sig, async () => {
          app.log.info(`Received ${sig}, closing server gracefully...`);
          await app.close();
          await prisma.$disconnect();
          process.exit(0);
        });
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

export { buildServer };
