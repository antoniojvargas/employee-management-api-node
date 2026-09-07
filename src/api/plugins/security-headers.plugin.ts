import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function registerSecurityHeaders(fastify: FastifyInstance): Promise<void> {
  await fastify.register(helmet);
}

export const securityHeadersPlugin = fp(registerSecurityHeaders, {
  name: 'security-headers',
});
