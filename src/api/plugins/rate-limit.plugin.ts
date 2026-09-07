import rateLimit, { type RateLimitOptions } from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const rateLimitDefaults: RateLimitOptions = {
  max: 1000,
  timeWindow: '1 minute',
};

export const loginRateLimitConfig: RateLimitOptions = {
  max: 5,
  timeWindow: '1 minute',
  errorResponseBuilder: (request: FastifyRequest) => {
    const error = new Error(
      'Demasiadas peticiones desde esta IP. Inténtalo de nuevo pasados unos segundos.',
    );
    (error as Error & { statusCode?: number }).statusCode = 429;
    (error as Error & { correlationId?: string }).correlationId = request.id;
    return error;
  },
};

async function registerRateLimit(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, rateLimitDefaults);
}

export const rateLimitPlugin = fp(registerRateLimit, {
  name: 'rate-limit',
});
