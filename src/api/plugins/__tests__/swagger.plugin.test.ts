import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { idParamsSchema, toJsonSchema } from '../../schemas/json-schema.js';
import { swaggerPlugin } from '../swagger.plugin.js';

const jobResponseSchema = toJsonSchema(z.object({ id: z.string().uuid(), name: z.string() }));

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(swaggerPlugin);

  app.get(
    '/jobs/:id',
    {
      schema: {
        tags: ['Trabajos'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: { 200: jobResponseSchema },
      },
    },
    async () => ({ id: '00000000-0000-0000-0000-000000000000', name: 'Backend' }),
  );

  app.post(
    '/jobs',
    {
      schema: {
        tags: ['Trabajos'],
        body: toJsonSchema(z.object({ name: z.string().min(3) })),
        response: { 201: jobResponseSchema },
      },
    },
    async () => ({ id: '00000000-0000-0000-0000-000000000000', name: 'Backend' }),
  );

  await app.ready();
  return app;
}

describe('Swagger', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expone el documento OpenAPI en /docs/json', async () => {
    const response = await request(app.server).get('/docs/json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\.0\.\d+$/);
    expect(response.body.info.title).toBeDefined();
    expect(response.body.paths['/jobs']).toBeDefined();
  });

  it('documenta los esquemas derivados de Zod (body y response)', async () => {
    const response = await request(app.server).get('/docs/json');
    const postJob = response.body.paths['/jobs'].post;

    expect(postJob.tags).toContain('Trabajos');
    expect(postJob.requestBody.content['application/json'].schema.properties.name).toMatchObject({
      type: 'string',
      minLength: 3,
    });
    expect(
      postJob.responses['201'].content['application/json'].schema.properties.name,
    ).toMatchObject({ type: 'string' });
  });

  it('documenta los parámetros de ruta como UUID', async () => {
    const response = await request(app.server).get('/docs/json');
    const getJob = response.body.paths['/jobs/{id}'];

    expect(getJob.get.parameters[0]).toMatchObject({
      in: 'path',
      name: 'id',
      schema: { type: 'string', format: 'uuid' },
    });
    expect(getJob.get.responses['200']).toBeDefined();
  });

  it('incluye el esquema de seguridad bearerAuth', async () => {
    const response = await request(app.server).get('/docs/json');

    expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('aplica bearerAuth como requisito de seguridad a las operaciones protegidas', async () => {
    const response = await request(app.server).get('/docs/json');
    const getJob = response.body.paths['/jobs/{id}'].get;

    expect(getJob.security).toEqual([{ bearerAuth: [] }]);
  });

  it('no exige autenticación en rutas públicas', async () => {
    const response = await request(app.server).get('/docs/json');
    const postJob = response.body.paths['/jobs'].post;

    expect(postJob.security).toBeUndefined();
  });

  it('sirve la interfaz Swagger UI en /docs', async () => {
    const response = await request(app.server).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
