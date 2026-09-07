import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandlerPlugin } from '../error-handler.plugin.js';
import { paginationPlugin, type PaginationPluginOptions } from '../pagination.plugin.js';

async function buildTestApp(options?: PaginationPluginOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin);
  await app.register(paginationPlugin, options ?? {});

  app.get('/paged', async (request) => request.pagination);

  await app.ready();
  return app;
}

describe('Paginación', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp({ defaultPageSize: 5, maxPageSize: 25 });
  });

  afterAll(async () => {
    await app.close();
  });

  it('aplica los valores por defecto cuando no se indican query params', async () => {
    const response = await request(app.server).get('/paged');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 1, pageSize: 5 });
  });

  it('lee page y pageSize del querystring', async () => {
    const response = await request(app.server).get('/paged?page=3&pageSize=15');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 3, pageSize: 15 });
  });

  it('recorta pageSize al máximo configurable', async () => {
    const response = await request(app.server).get('/paged?pageSize=100');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 1, pageSize: 25 });
  });

  it('devuelve 400 cuando page no es un entero positivo', async () => {
    const response = await request(app.server).get('/paged?page=abc');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('page debe ser un entero mayor o igual a 1');
  });

  it('devuelve 400 cuando pageSize es menor que 1', async () => {
    const response = await request(app.server).get('/paged?pageSize=0');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('pageSize debe ser un entero mayor o igual a 1');
  });
});
