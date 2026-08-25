import 'reflect-metadata';
import Fastify from 'fastify';
import { env } from './infrastructure/config/env.js';
import { AppDataSource } from './infrastructure/database/data-source.js';

const app = Fastify({ logger: true });

app.get('/health', async (_request, reply) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.query('SELECT 1');
    return reply.status(200).send({ status: 'ok', db: 'connected' });
  } catch {
    return reply.status(503).send({ status: 'error', db: 'unavailable' });
  }
});

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
