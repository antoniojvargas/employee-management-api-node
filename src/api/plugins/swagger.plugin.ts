import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Employee Management API',
        description: 'API de gestión de empleados, departamentos y proyectos.',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
}

export const swaggerPlugin = fp(registerSwagger, {
  name: 'swagger',
});
