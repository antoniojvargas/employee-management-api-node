import 'reflect-metadata';
import Fastify from 'fastify';
import { corsPlugin } from './api/plugins/cors.plugin.js';
import { jwtAuthPlugin } from './api/plugins/jwt-auth.js';
import { requestLoggingPlugin } from './api/plugins/request-logging.plugin.js';
import { errorHandlerPlugin } from './api/plugins/error-handler.plugin.js';
import { rateLimitPlugin } from './api/plugins/rate-limit.plugin.js';
import { securityHeadersPlugin } from './api/plugins/security-headers.plugin.js';
import { swaggerPlugin } from './api/plugins/swagger.plugin.js';
import { paginationPlugin } from './api/plugins/pagination.plugin.js';
import { authRoutes } from './api/routes/auth.routes.js';
import { departmentRoutes } from './api/routes/departments.routes.js';
import { employeeRoutes } from './api/routes/employees.routes.js';
import { projectRoutes } from './api/routes/projects.routes.js';
import { env } from './infrastructure/config/env.js';
import { buildLoggerOptions } from './infrastructure/config/logger.js';
import { AppDataSource } from './infrastructure/database/data-source.js';
import { migrateAndSeed } from './infrastructure/database/migrate-and-seed.js';
import { dateTimeFormat } from './api/schemas/json-schema.js';

const app = Fastify({
  logger: buildLoggerOptions(),
  ajv: {
    onCreate: dateTimeFormat,
  },
});

app.register(corsPlugin);
app.register(rateLimitPlugin);
app.register(jwtAuthPlugin);
app.register(requestLoggingPlugin);
app.register(errorHandlerPlugin);
app.register(securityHeadersPlugin);
app.register(swaggerPlugin);
app.register(paginationPlugin);
app.register(authRoutes);
app.register(departmentRoutes);
app.register(employeeRoutes);
app.register(projectRoutes);

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
