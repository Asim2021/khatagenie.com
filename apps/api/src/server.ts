import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
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

dotenv.config({ path: path.join(__dirname, '../.env') });

const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
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
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'khatagenie_super_secure_jwt_secret_2026_delhi',
  });

  await server.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB max
    },
  });

  // Serve uploaded images statically
  await server.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // 2. Health check route
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'khatagenie-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 3. Register API Modules
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
  await server.register(clientRoutes, { prefix: '/api/v1/clients' });
  await server.register(exportRoutes, { prefix: '/api/v1/exports' });
  await server.register(whatsappRoutes, { prefix: '/api/v1/whatsapp' });

  // 4. Global Error Handler
  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.name || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.',
    });
  });

  return server;
}

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

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
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

export { buildServer };
