import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const EXCLUDED_PREFIXES = ['/health', '/docs'];

const requestStart = new WeakMap<FastifyRequest, number>();

function isExcluded(url: string): boolean {
  const path = url.split('?')[0];
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function registerRequestLogging(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    if (isExcluded(request.url)) {
      return;
    }
    requestStart.set(request, Date.now());
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (isExcluded(request.url)) {
      return;
    }

    const start = requestStart.get(request);
    const durationMs = start !== undefined ? Date.now() - start : 0;
    requestStart.delete(request);

    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs,
      correlationId: request.id,
    });
  });
}

export const requestLoggingPlugin = fp(registerRequestLogging, { name: 'request-logging' });
