import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodError } from 'zod';
import {
  loginDtoSchema,
  registerDtoSchema,
  type LoginDto,
  type RegisterDto,
} from '../../application/dtos/auth.dto.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { RoleEntity } from '../../infrastructure/database/entities/role.orm-entity.js';
import { UserEntity } from '../../infrastructure/database/entities/user.orm-entity.js';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/user.repository.js';
import { AuthService, type AuthError } from '../../infrastructure/auth/auth.service.js';
import { JwtTokenService } from '../../infrastructure/auth/jwt-token.service.js';

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
  const users = new TypeOrmUserRepository(
    AppDataSource.getRepository(UserEntity),
    AppDataSource.getRepository(RoleEntity),
  );
  const authService = new AuthService(users, new JwtTokenService());

  fastify.post('/api/auth/register', async (request, reply) => {
    let input: RegisterDto;
    try {
      input = registerDtoSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
      }
      throw err;
    }

    const result = await authService.register(input);
    if (!result.ok) {
      const { statusCode, message } = authErrorResponse(result.error);
      return reply.code(statusCode).send({ message });
    }
    return reply.code(201).send(result.data);
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    let input: LoginDto;
    try {
      input = loginDtoSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
      }
      throw err;
    }

    const result = await authService.login(input);
    if (!result.ok) {
      const { statusCode, message } = authErrorResponse(result.error);
      return reply.code(statusCode).send({ message });
    }
    return reply.code(200).send(result.data);
  });
}
