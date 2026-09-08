import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authResponseDtoSchema,
  loginDtoSchema,
  registerDtoSchema,
  type LoginDto,
  type RegisterDto,
} from '../../application/dtos/auth.dto.js';
import type { AuthError } from '../../application/services/auth.service.js';
import { getAuthService } from '../../infrastructure/di/app-container.js';
import { loginRateLimitConfig } from '../plugins/rate-limit.plugin.js';
import { messageErrorResponseSchema, toJsonSchema } from '../schemas/json-schema.js';

function authErrorResponse(error: AuthError): { statusCode: number; message: string } {
  switch (error.code) {
    case 'email_in_use':
      return { statusCode: 409, message: 'El email ya está registrado' };
    case 'invalid_credentials':
      return { statusCode: 401, message: 'Credenciales inválidas' };
    case 'role_not_found':
      return {
        statusCode: 500,
        message: 'El rol por defecto no está configurado en la base de datos',
      };
  }
}

export async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const authService = getAuthService();

  const registerSuccessSchema = toJsonSchema(authResponseDtoSchema);

  fastify.post(
    '/api/auth/register',
    {
      schema: {
        tags: ['Autenticación'],
        body: toJsonSchema(registerDtoSchema),
        response: {
          201: registerSuccessSchema,
          409: messageErrorResponseSchema,
          500: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const input = request.body as RegisterDto;
      const result = await authService.register(input);
      if (!result.ok) {
        const { statusCode, message } = authErrorResponse(result.error);
        return reply.code(statusCode as 201 | 409 | 500).send({ message });
      }
      return reply.code(201).send(result.data);
    },
  );

  fastify.post(
    '/api/auth/login',
    {
      config: { rateLimit: loginRateLimitConfig },
      schema: {
        tags: ['Autenticación'],
        body: toJsonSchema(loginDtoSchema),
        response: {
          200: toJsonSchema(authResponseDtoSchema),
          401: messageErrorResponseSchema,
          500: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const input = request.body as LoginDto;
      const result = await authService.login(input);
      if (!result.ok) {
        const { statusCode, message } = authErrorResponse(result.error);
        return reply.code(statusCode as 200 | 401 | 500).send({ message });
      }
      return reply.code(200).send(result.data);
    },
  );
}
