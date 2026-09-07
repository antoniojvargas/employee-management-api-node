import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { securityHeadersPlugin } from '../security-headers.plugin.js';

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(securityHeadersPlugin);

  app.get('/ping', async () => ({ ok: true }));

  await app.ready();
  return app;
}

describe('Security headers (helmet)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('incluye Content-Security-Policy en las respuestas', async () => {
    const response = await request(app.server).get('/ping');

    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('incluye X-Content-Type-Options: nosniff', async () => {
    const response = await request(app.server).get('/ping');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('incluye X-Frame-Options: SAMEORIGIN', async () => {
    const response = await request(app.server).get('/ping');

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('incluye Strict-Transport-Security', async () => {
    const response = await request(app.server).get('/ping');

    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('aplica las cabeceras también a respuestas de error', async () => {
    const response = await request(app.server).get('/no-existe');

    expect(response.status).toBe(404);
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
