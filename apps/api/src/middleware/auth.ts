import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedUser } from '../types/fastify';

/**
 * Authentication Middleware: Validates JWT Bearer token and attaches user & organization context.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<AuthenticatedUser>();
    request.user = payload;
  } catch (err) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing authentication token.',
    });
  }
}
