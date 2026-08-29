import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import type { RoleName } from '../../application/constants/roles.js';
import type { JwtTokenPayload } from '../../infrastructure/auth/jwt-token.service.js';
import { env } from '../../infrastructure/config/env.js';

type AuthorizeRoleHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtTokenPayload;
    user: JwtTokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: RoleName[]) => AuthorizeRoleHook;
  }
}

async function registerJwtAuth(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
    messages: {
      badRequestErrorMessage: 'Formato inválido: se espera Authorization: Bearer [token]',
      noAuthorizationInHeaderMessage: 'No se encontró un token de autorización en el encabezado',
      authorizationTokenExpiredMessage: 'El token de autorización ha expirado',
      authorizationTokenInvalid: 'La firma del token de autorización es inválida',
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'El token de autorización es inválido';
      reply.code(401).send({ message });
    }
  });

  fastify.decorate('requireRole', (...roles: RoleName[]): AuthorizeRoleHook => {
    if (roles.length === 0) {
      throw new Error('requireRole: se debe indicar al menos un rol');
    }

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'El token de autorización es inválido';
        reply.code(401).send({ message });
        return;
      }

      const authorized = roles.some((role) => request.user.roles.includes(role));
      if (!authorized) {
        reply.code(403).send({
          message: `No autorizado: se requiere el rol ${roles.join(' o ')}`,
        });
      }
    };
  });
}

export const jwtAuthPlugin = fp(registerJwtAuth, { name: 'jwt-auth' });
