import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { jwtAuthPlugin } from '../../api/plugins/jwt-auth.js';
import { authRoutes } from '../../api/routes/auth.routes.js';
import { departmentRoutes } from '../../api/routes/departments.routes.js';
import { employeeRoutes } from '../../api/routes/employees.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(jwtAuthPlugin);
  await app.register(authRoutes);
  await app.register(departmentRoutes);
  await app.register(employeeRoutes);

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok', db: 'connected' });
  });

  await app.ready();

  return app;
}
