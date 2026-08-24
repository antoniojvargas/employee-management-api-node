import 'reflect-metadata';
import Fastify from 'fastify';
import { env } from './infrastructure/config/env.js';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
