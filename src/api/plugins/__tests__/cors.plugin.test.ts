import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { corsPlugin, type CorsPluginOptions } from '../cors.plugin.js';

async function buildTestApp(pluginOptions?: CorsPluginOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(corsPlugin, pluginOptions ?? {});

  app.get('/ping', async () => ({ ok: true }));

  await app.ready();
  return app;
}

describe('CORS (plugin con whitelist)', () => {
  let app: FastifyInstance;
  let lenientApp: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp({ origins: ['http://app.example.com'] });
    lenientApp = await buildTestApp(); // sin origins: env vacío => CORS deshabilitado
  });

  afterAll(async () => {
    await app.close();
    await lenientApp.close();
  });

  it('permite orígenes de la whitelist y habilita credenciales', async () => {
    const response = await request(app.server).get('/ping').set('Origin', 'http://app.example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://app.example.com');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('no envía cabeceras CORS a orígenes fuera de la whitelist', async () => {
    const response = await request(app.server)
      .get('/ping')
      .set('Origin', 'http://evil.example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde preflight (OPTIONS) de un origen permitido con 204 y cabeceras CORS', async () => {
    const response = await request(app.server)
      .options('/ping')
      .set('Origin', 'http://app.example.com')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://app.example.com');
    expect(response.headers['access-control-allow-methods']).toContain('GET');
    expect(response.headers['access-control-allow-headers']).toMatch(/authorization/i);
  });

  it('rechaza preflight (OPTIONS) de un origen no permitido', async () => {
    const response = await request(app.server)
      .options('/ping')
      .set('Origin', 'http://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('no añade cabeceras CORS a peticiones sin origen (same-origin)', async () => {
    const response = await request(app.server).get('/ping');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('con whitelist vacía el CORS queda deshabilitado', async () => {
    const response = await request(lenientApp.server)
      .get('/ping')
      .set('Origin', 'http://cualquiera.example.com');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
