import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../../infrastructure/config/env.js';

const INTERNAL_ERROR_MESSAGE = 'Error interno del servidor';

const HTTP_STATUS_ERROR_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export interface ErrorHandlerOptions {
  isProduction?: boolean;
}

interface ErrorResponse {
  error: string;
  message: string;
  correlationId: string;
}

function resolveStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600) {
      return statusCode;
    }
  }
  return 500;
}

function errorName(statusCode: number): string {
  return HTTP_STATUS_ERROR_NAMES[statusCode] ?? 'Error';
}

function resolveMessage(error: unknown, statusCode: number, isProduction: boolean): string {
  if (statusCode >= 500 && isProduction) {
    return INTERNAL_ERROR_MESSAGE;
  }
  return error instanceof Error && error.message ? error.message : 'Error inesperado';
}

function sendErrorResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  statusCode: number,
  isProduction: boolean,
): FastifyReply {
  const response: ErrorResponse = {
    error: errorName(statusCode),
    message: resolveMessage(error, statusCode, isProduction),
    correlationId: request.id,
  };

  const logPayload = {
    err: error,
    correlationId: request.id,
    method: request.method,
    url: request.url,
  };

  if (statusCode >= 500) {
    request.log.error(logPayload, 'Error no controlado');
  } else {
    request.log.warn(logPayload, 'Error de petición');
  }

  return reply.code(statusCode).send(response);
}

async function registerErrorHandler(
  fastify: FastifyInstance,
  options: ErrorHandlerOptions,
): Promise<void> {
  const isProduction = options.isProduction ?? env.NODE_ENV === 'production';

  fastify.setErrorHandler(
    async (
      caughtError: unknown,
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<FastifyReply> => {
      const statusCode = resolveStatus(caughtError);
      return sendErrorResponse(request, reply, caughtError, statusCode, isProduction);
    },
  );

  fastify.setNotFoundHandler(
    async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
      return reply.code(404).send({
        error: errorName(404),
        message: `Ruta no encontrada: ${request.method} ${request.url}`,
        correlationId: request.id,
      });
    },
  );
}

export const errorHandlerPlugin = fp(registerErrorHandler, {
  name: 'error-handler',
});
