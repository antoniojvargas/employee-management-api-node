import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../../infrastructure/config/env.js';

export interface CorsPluginOptions {
  origins?: string[];
}

const envOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

async function registerCors(fastify: FastifyInstance, options: CorsPluginOptions): Promise<void> {
  const origins = options.origins ?? envOrigins;

  await fastify.register(cors, {
    origin: origins.length > 0 ? origins : false,
    credentials: true,
  });
}

export const corsPlugin = fp(registerCors, {
  name: 'cors',
});
