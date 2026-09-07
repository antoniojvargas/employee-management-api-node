import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandlerPlugin } from '../error-handler.plugin.js';
import { loginRateLimitConfig, rateLimitPlugin } from '../rate-limit.plugin.js';

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(errorHandlerPlugin);
  await app.register(rateLimitPlugin);

  app.post('/api/auth/login', { config: { rateLimit: loginRateLimitConfig } }, async () => ({
    token: 'fake-jwt',
  }));

  app.get('/publico', async () => ({ ok: true }));

  await app.ready();
  return app;
}

describe('Rate limit (por IP en rutas sensibles)', () => {
  const MAX_LOGIN_ATTEMPTS = 5;
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite las peticiones hasta el máximo configurado', async () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      const response = await request(app.server)
        .post('/api/auth/login')
        .send({ email: `usuario${i}@example.com`, password: '12345678' });

      expect(response.status).toBe(200);
    }
  });

  it('responde 429 cuando se supera el límite y usa el formato de error del API', async () => {
    const response = await request(app.server)
      .post('/api/auth/login')
      .send({ email: 'tope@example.com', password: '12345678' });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      error: 'Too Many Requests',
      message: expect.any(String),
      correlationId: expect.any(String),
    });
  });

  it('no limita el resto de rutas por debajo del máximo global', async () => {
    const response = await request(app.server).get('/publico');

    expect(response.status).toBe(200);
  });
});
