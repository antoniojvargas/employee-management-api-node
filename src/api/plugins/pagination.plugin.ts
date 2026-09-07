import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { PaginationParams } from '../../application/types/pagination.js';
import { env } from '../../infrastructure/config/env.js';
import { ValidationError } from '../../application/errors/index.js';

export interface PaginationPluginOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    pagination: PaginationParams;
  }
}

function parsePositiveInteger(value: unknown, message: string): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(message);
  }
  return parsed;
}

function resolvePagination(request: FastifyRequest, options: PaginationPluginOptions): void {
  const query = request.query as Record<string, unknown>;
  const defaultPageSize = options.defaultPageSize ?? env.DEFAULT_PAGE_SIZE;
  const maxPageSize = options.maxPageSize ?? env.MAX_PAGE_SIZE;

  const parsedPage = parsePositiveInteger(query.page, 'page debe ser un entero mayor o igual a 1');
  const parsedPageSize = parsePositiveInteger(
    query.pageSize,
    'pageSize debe ser un entero mayor o igual a 1',
  );

  request.pagination = {
    page: parsedPage > 0 ? parsedPage : 1,
    pageSize: parsedPageSize > 0 ? Math.min(parsedPageSize, maxPageSize) : defaultPageSize,
  };
}

async function registerPagination(
  fastify: FastifyInstance,
  options: PaginationPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    resolvePagination(request, options);
  });
}

export const paginationPlugin = fp(registerPagination, {
  name: 'pagination',
});
