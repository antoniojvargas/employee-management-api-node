import 'reflect-metadata';
import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../application/errors/index.js';
import type { JsonSchema } from '../../schemas/json-schema.js';
import { errorHandlerPlugin, type ErrorHandlerOptions } from '../error-handler.plugin.js';

async function buildTestApp(pluginOptions?: ErrorHandlerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin, pluginOptions ?? {});

  app.get('/boom', async () => {
    throw new Error('Detalle interno de la base de datos');
  });

  app.get('/boom-4xx', async () => {
    const err = new Error('Datos de entrada inválidos') as Error & { statusCode?: number };
    err.statusCode = 422;
    throw err;
  });

  app.get('/not-found', async () => {
    throw new NotFoundError('El empleado no existe');
  });

  app.get('/validation', async () => {
    throw new ValidationError('El salario debe ser positivo');
  });

  app.get('/unauthorized', async () => {
    throw new UnauthorizedError('Credenciales inválidas');
  });

  const bodySchema: JsonSchema = {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string' } },
    additionalProperties: false,
  };

  app.post('/schema-validation', { schema: { body: bodySchema } }, async () => 'ok');

  app.get('/explicit', async (_request, reply) => {
    return reply.code(404).send({ message: 'Sin formato global' });
  });

  await app.ready();
  return app;
}

describe('Error handler global (plugin de Fastify)', () => {
  let app: FastifyInstance;
  let productionApp: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    productionApp = await buildTestApp({ isProduction: true });
  });

  afterAll(async () => {
    await app.close();
    await productionApp.close();
  });

  it('devuelve 404 con formato consistente para rutas no encontradas', async () => {
    const response = await request(app.server).get('/ruta/desconocida');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'Ruta no encontrada: GET /ruta/desconocida',
      correlationId: expect.any(String),
    });
  });

  it('captura excepciones no controladas con status 500 y expone el mensaje en desarrollo', async () => {
    const response = await request(app.server).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal Server Error',
      message: 'Detalle interno de la base de datos',
      correlationId: expect.any(String),
    });
  });

  it('incluye un correlationId no vacío en la respuesta de error', async () => {
    const response = await request(app.server).get('/boom');

    expect(response.status).toBe(500);
    expect(typeof response.body.correlationId).toBe('string');
    expect(response.body.correlationId.length).toBeGreaterThan(0);
  });

  it('mantiene el status code 4xx y el mensaje de errores de cliente', async () => {
    const response = await request(app.server).get('/boom-4xx');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: 'Unprocessable Entity',
      message: 'Datos de entrada inválidos',
      correlationId: expect.any(String),
    });
  });

  it('mapea NotFoundError a 404 Not Found', async () => {
    const response = await request(app.server).get('/not-found');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'El empleado no existe',
      correlationId: expect.any(String),
    });
  });

  it('mapea ValidationError a 400 Bad Request', async () => {
    const response = await request(app.server).get('/validation');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Bad Request',
      message: 'El salario debe ser positivo',
      correlationId: expect.any(String),
    });
  });

  it('mapea UnauthorizedError a 401 Unauthorized', async () => {
    const response = await request(app.server).get('/unauthorized');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized',
      message: 'Credenciales inválidas',
      correlationId: expect.any(String),
    });
  });

  it('mapea errores de validación de esquema Fastify a 400 con mensaje genérico', async () => {
    const response = await request(app.server).post('/schema-validation').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Bad Request',
      message: 'Datos inválidos',
      correlationId: expect.any(String),
    });
  });

  it('no altera las respuestas de error emitidas explícitamente por las rutas', async () => {
    const response = await request(app.server).get('/explicit');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Sin formato global' });
  });

  it('oculta los detalles internos en producción (500 genérico)', async () => {
    const response = await request(productionApp.server).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
      correlationId: expect.any(String),
    });
  });

  it('expone el mensaje de errores de dominio 4xx también en producción', async () => {
    const response = await request(productionApp.server).get('/not-found');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'El empleado no existe',
      correlationId: expect.any(String),
    });
  });
});
