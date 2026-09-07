import type { Ajv } from 'ajv';
import { z } from 'zod';
import { env } from '../../infrastructure/config/env.js';

export type JsonSchema = Record<string, unknown>;

export function toJsonSchema(schema: z.ZodType): JsonSchema {
  return z.toJSONSchema(schema, {
    target: 'openApi3',
    reused: 'inline',
    unrepresentable: 'any',
    override: (ctx) => {
      const def = ctx.zodSchema._zod.def;
      if (def.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
    },
  }) as JsonSchema;
}

export function dateTimeFormat(ajv: Ajv): Ajv {
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (value: unknown): boolean =>
      typeof value === 'string' && !Number.isNaN(Date.parse(value)),
  });
  return ajv;
}

export const messageErrorResponseSchema: JsonSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
  additionalProperties: false,
};

export const idParamsSchema = toJsonSchema(z.object({ id: z.string().uuid() }));

export const idAndProjectIdParamsSchema = toJsonSchema(
  z.object({ id: z.string().uuid(), projectId: z.string().uuid() }),
);

export function paginationQuerySchema(): JsonSchema {
  return {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, default: env.DEFAULT_PAGE_SIZE },
    },
  };
}

export function paginatedResponseSchema(itemsSchema: JsonSchema): JsonSchema {
  return {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: itemsSchema,
      },
      pagination: {
        type: 'object',
        required: ['page', 'pageSize', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1 },
          total: { type: 'integer', minimum: 0 },
          totalPages: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  };
}
