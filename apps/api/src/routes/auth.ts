import { FastifyInstance } from 'fastify';
import { LoginRequestSchema } from '@khatagenie/types';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { authenticate } from '../middleware/auth';

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes rotation interval
const REFRESH_TOKEN_EXPIRY_DEFAULT = '1d'; // 1 day
const REFRESH_TOKEN_EXPIRY_REMEMBER = '7d'; // 7 days

const ONE_DAY_SECONDS = 24 * 60 * 60;
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export async function authRoutes(server: FastifyInstance) {
  // Helper to format user response
  const formatUserResponse = (user: any) => {
    const subscriptionTier = (user.organization?.subscriptionTier as any) || 'free';
    const featureOverrides = (user.organization?.featureOverrides as Record<string, boolean>) || {};
    return {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      subscriptionTier,
      organizationName: user.organization?.name,
      featureOverrides,
      features: featureOverrides,
    };
  };

  // Helper to issue tokens & set httpOnly refresh cookie
  const issueAuthTokens = (reply: any, user: any, rememberMe: boolean = false) => {
    const accessToken = server.jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email: user.email,
        type: 'access',
      },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = server.jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email: user.email,
        type: 'refresh',
        rememberMe,
      },
      { expiresIn: rememberMe ? REFRESH_TOKEN_EXPIRY_REMEMBER : REFRESH_TOKEN_EXPIRY_DEFAULT }
    );

    const maxAge = rememberMe ? SEVEN_DAYS_SECONDS : ONE_DAY_SECONDS;

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge,
    });

    return accessToken;
  };

  // 1. POST /api/v1/auth/login
  server.post('/login', async (request, reply) => {
    const parseResult = LoginRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email or password format.',
        details: parseResult.error.format(),
      });
    }

    const { email, password, rememberMe } = parseResult.data;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (user && user.isActive) {
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (passwordMatch) {
          const accessToken = issueAuthTokens(reply, user, rememberMe);

          return {
            token: accessToken,
            user: formatUserResponse(user),
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

  // 2. POST /api/v1/auth/refresh (Rotate Access Token via httpOnly Cookie)
  server.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'No refresh token provided in cookies.',
      });
    }

    try {
      const decoded = server.jwt.verify<any>(refreshToken);

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({
          error: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type provided.',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (!user || !user.isActive) {
        reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
        return reply.status(401).send({
          error: 'USER_INACTIVE_OR_NOT_FOUND',
          message: 'User account is deactivated or no longer exists.',
        });
      }

      // Rotate access token and refresh cookie
      const rememberMe = Boolean(decoded.rememberMe);
      const newAccessToken = issueAuthTokens(reply, user, rememberMe);

      return {
        token: newAccessToken,
        user: formatUserResponse(user),
      };
    } catch (err: any) {
      reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
      return reply.status(401).send({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Session has expired. Please sign in again.',
      });
    }
  });

  // 3. POST /api/v1/auth/logout (Clear httpOnly Cookie)
  server.post('/logout', async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  });

  // 4. GET /api/v1/auth/me (Current In-Session User)
  server.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (user) {
        return {
          user: formatUserResponse(user),
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

  // 5. POST /api/v1/auth/register (Practice Registration)
  server.post('/register', async (request, reply) => {
    const { firmName, fullName, email, password, phone, rememberMe } = request.body as any;

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

      const userWithOrg = { ...user, organization };
      const accessToken = issueAuthTokens(reply, userWithOrg, rememberMe);

      return {
        token: accessToken,
        user: formatUserResponse(userWithOrg),
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
