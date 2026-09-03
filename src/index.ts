import 'reflect-metadata';
import Fastify from 'fastify';
import { jwtAuthPlugin } from './api/plugins/jwt-auth.js';
import { authRoutes } from './api/routes/auth.routes.js';
import { departmentRoutes } from './api/routes/departments.routes.js';
import { employeeRoutes } from './api/routes/employees.routes.js';
import { env } from './infrastructure/config/env.js';
import { AppDataSource } from './infrastructure/database/data-source.js';
import { migrateAndSeed } from './infrastructure/database/migrate-and-seed.js';

const app = Fastify({ logger: true });

app.register(jwtAuthPlugin);
app.register(authRoutes);
app.register(departmentRoutes);
app.register(employeeRoutes);

app.get('/health', async (_request, reply) => {
  try {
    await AppDataSource.query('SELECT 1');
    return reply.status(200).send({ status: 'ok', db: 'connected' });
  } catch {
    return reply.status(503).send({ status: 'error', db: 'unavailable' });
  }
});

const start = async (): Promise<void> => {
  try {
    await migrateAndSeed();
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
