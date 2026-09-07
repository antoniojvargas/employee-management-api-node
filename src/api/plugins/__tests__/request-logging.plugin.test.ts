import { PassThrough } from 'node:stream';
import request from 'supertest';
import Fastify, { type FastifyInstance } from 'fastify';
import { requestLoggingPlugin } from '../request-logging.plugin.js';

interface LogRecord {
  level: number;
  reqId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
  correlationId?: string;
}

function createLogStream(): { stream: PassThrough; records: LogRecord[] } {
  const records: LogRecord[] = [];
  const stream = new PassThrough();
  stream.on('data', (chunk: Buffer) => {
    records.push(JSON.parse(chunk.toString()) as LogRecord);
  });
  return { stream, records };
}

async function flushLogs(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function buildTestApp(): Promise<{ app: FastifyInstance; records: LogRecord[] }> {
  const { stream, records } = createLogStream();
  const app = Fastify({ logger: { level: 'info', stream } });
  await app.register(requestLoggingPlugin);

  app.get('/test', async () => 'ok');
  app.get('/health', async () => 'healthy');
  app.get('/docs', async () => 'docs');

  await app.ready();
  return { app, records };
}

describe('Middleware de logging de requests', () => {
  let app: FastifyInstance;
  let records: LogRecord[];

  beforeAll(async () => {
    const built = await buildTestApp();
    app = built.app;
    records = built.records;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra método, url, status code, duración y correlationId de cada request', async () => {
    const response = await request(app.server).get('/test');
    await flushLogs();

    expect(response.status).toBe(200);
    const log = records.find((record) => record.url === '/test');
    expect(log).toMatchObject({
      method: 'GET',
      statusCode: 200,
      correlationId: expect.any(String),
    });
    expect(typeof log?.durationMs).toBe('number');
    expect(log?.durationMs ?? -1).toBeGreaterThanOrEqual(0);
  });

  it('incluye el correlationId del request también como reqId', async () => {
    await request(app.server).get('/test');
    await flushLogs();

    const log = records.find((record) => record.url === '/test');
    expect(log?.reqId).toBeDefined();
    expect(typeof log?.reqId).toBe('string');
  });

  it('no registra requests a rutas excluidas (/health y /docs)', async () => {
    const responseHealth = await request(app.server).get('/health');
    const responseDocs = await request(app.server).get('/docs');
    await flushLogs();

    expect(responseHealth.status).toBe(200);
    expect(responseDocs.status).toBe(200);
    expect(records.some((record) => record.url === '/health')).toBe(false);
    expect(records.some((record) => record.url === '/docs')).toBe(false);
  });

  it('ignora el querystring al aplicar el prefijo de exclusión', async () => {
    const responseHealth = await request(app.server).get('/health?check=1');
    await flushLogs();

    expect(responseHealth.status).toBe(200);
    expect(records.some((record) => record.url === '/health?check=1')).toBe(false);
  });
});
