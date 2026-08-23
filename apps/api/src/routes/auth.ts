import { FastifyInstance } from 'fastify';
import { LoginRequestSchema, UserRole } from '@khatagenie/types';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth';

export async function authRoutes(server: FastifyInstance) {
  // POST /api/v1/auth/login
  server.post('/login', async (request, reply) => {
    const parseResult = LoginRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email or password format.',
        details: parseResult.error.format(),
      });
    }

    const { email, password } = parseResult.data;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (user && user.isActive) {
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (passwordMatch) {
          const token = server.jwt.sign(
            {
              userId: user.id,
              organizationId: user.organizationId,
              role: user.role,
              email: user.email,
            },
            { expiresIn: '7d' }
          );

          const subscriptionTier = (user.organization.subscriptionTier as any) || 'free';
          const featureOverrides = (user.organization.featureOverrides as Record<string, boolean>) || {};

          return {
            token,
            user: {
              id: user.id,
              organizationId: user.organizationId,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              subscriptionTier,
              organizationName: user.organization.name,
              featureOverrides,
            },
          };
        }
      }
    } catch (err: any) {
      console.error(`[Auth] Database authentication error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Unable to process authentication request.',
      });
    }

    return reply.status(401).send({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
  });

  // GET /api/v1/auth/me
  server.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (user) {
        return {
          user: {
            id: user.id,
            organizationId: user.organizationId,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            organizationName: user.organization.name,
            subscriptionTier: user.organization.subscriptionTier,
            featureOverrides: user.organization.featureOverrides || {},
          },
        };
      }

      return reply.status(404).send({
        error: 'USER_NOT_FOUND',
        message: 'User account not found.',
      });
    } catch (err: any) {
      console.error(`[Auth] /me error: ${err.message}`);
      return reply.status(500).send({
        error: 'DATABASE_ERROR',
        message: 'Unable to retrieve user details.',
      });
    }
  });

  // POST /api/v1/auth/register
  server.post('/register', async (request, reply) => {
    const { firmName, fullName, email, password, phone } = request.body as any;

    if (!firmName || !fullName || !email || !password || !phone) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Firm name, full name, email, password, and phone are required.',
      });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({
          error: 'EMAIL_EXISTS',
          message: 'An account with this email address already exists.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const organization = await prisma.organization.create({
        data: {
          name: firmName,
          phone,
          email,
          subscriptionTier: 'pro',
          featureOverrides: {
            feature_whatsapp_ingestion: true,
            feature_ai_vision_extraction: true,
            feature_split_screen_review: true,
            feature_tally_xml_export: true,
            feature_excel_export: true,
            feature_direct_upload: true,
            feature_advanced_gstin_validation: true,
            feature_gstr2b_reconciliation: true,
            feature_multi_page_pdf: true,
          },
        },
      });

      const user = await prisma.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash,
          fullName,
          role: 'CA_ADMIN',
        },
      });

      const token = server.jwt.sign(
        {
          userId: user.id,
          organizationId: organization.id,
          role: user.role,
          email: user.email,
        },
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          organizationId: organization.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subscriptionTier: organization.subscriptionTier,
          organizationName: organization.name,
          featureOverrides: organization.featureOverrides || {},
        },
      };
    } catch (err: any) {
      console.error(`[Auth] /register database error: ${err.message}`);
      return reply.status(500).send({
        error: 'REGISTRATION_FAILED',
        message: 'Failed to create organization and user account.',
      });
    }
  });
}
