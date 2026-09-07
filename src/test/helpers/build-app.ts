import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { corsPlugin } from '../../api/plugins/cors.plugin.js';
import { jwtAuthPlugin } from '../../api/plugins/jwt-auth.js';
import { requestLoggingPlugin } from '../../api/plugins/request-logging.plugin.js';
import { errorHandlerPlugin } from '../../api/plugins/error-handler.plugin.js';
import { rateLimitPlugin } from '../../api/plugins/rate-limit.plugin.js';
import { securityHeadersPlugin } from '../../api/plugins/security-headers.plugin.js';
import { swaggerPlugin } from '../../api/plugins/swagger.plugin.js';
import { dateTimeFormat } from '../../api/schemas/json-schema.js';
import { authRoutes } from '../../api/routes/auth.routes.js';
import { departmentRoutes } from '../../api/routes/departments.routes.js';
import { employeeRoutes } from '../../api/routes/employees.routes.js';
import { projectRoutes } from '../../api/routes/projects.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, ajv: { onCreate: dateTimeFormat } });

  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(jwtAuthPlugin);
  await app.register(requestLoggingPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(securityHeadersPlugin);
  await app.register(swaggerPlugin);
  await app.register(authRoutes);
  await app.register(departmentRoutes);
  await app.register(employeeRoutes);
  await app.register(projectRoutes);

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok', db: 'connected' });
  });

  await app.ready();

  return app;
}
