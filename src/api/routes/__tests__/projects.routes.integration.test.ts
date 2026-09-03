import 'reflect-metadata';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { AppDataSource } from '../../../infrastructure/database/data-source.js';
import { JwtTokenService } from '../../../infrastructure/auth/jwt-token.service.js';
import { buildApp } from '../../../test/helpers/build-app.js';
import { Roles } from '../../../application/constants/roles.js';
import type { RoleName } from '../../../application/constants/roles.js';

const tokenService = new JwtTokenService();

let app: FastifyInstance;
let adminToken: string;
let userToken: string;

function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function createToken(roles: RoleName[]): Promise<string> {
  return tokenService.generateToken('user-id', 'user@example.com', roles);
}

async function truncateTables(): Promise<void> {
  await AppDataSource.query('TRUNCATE TABLE "employee_projects" RESTART IDENTITY CASCADE');
  await AppDataSource.query('TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE');
}

async function insertProject(name: string): Promise<string> {
  const result = await AppDataSource.query(
    `INSERT INTO "projects" (name, start_date, end_date)
     VALUES ($1, $2, $3) RETURNING id`,
    [name, '2026-02-01', '2026-12-31'],
  );
  return result[0].id;
}

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  app = await buildApp();
  adminToken = await createToken([Roles.Admin]);
  userToken = await createToken([Roles.User]);
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

beforeEach(async () => {
  await truncateTables();
});

describe('Project routes (integración)', () => {
  describe('GET /api/projects', () => {
    it('devuelve 200 con todos los proyectos', async () => {
      await insertProject('API Platform');
      await insertProject('Mobile App');

      const response = await request(app.server).get('/api/projects').set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      const names = response.body.map((p: { name: string }) => p.name);
      expect(names).toEqual(expect.arrayContaining(['API Platform', 'Mobile App']));
    });

    it('devuelve 200 con lista vacía cuando no hay proyectos', async () => {
      const response = await request(app.server).get('/api/projects').set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('permite acceso a usuarios con rol User', async () => {
      await insertProject('API Platform');

      const response = await request(app.server).get('/api/projects').set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('devuelve 401 sin token de autorización', async () => {
      const response = await request(app.server).get('/api/projects');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('devuelve 200 con el proyecto encontrado', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .get(`/api/projects/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id, name: 'API Platform' });
      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();
    });

    it('devuelve 404 cuando el proyecto no existe', async () => {
      const response = await request(app.server)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Proyecto no encontrado' });
    });

    it('permite lectura a usuarios con rol User', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .get(`/api/projects/${id}`)
        .set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('API Platform');
    });
  });

  describe('POST /api/projects', () => {
    it('devuelve 201 y crea el proyecto', async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set(authHeader(adminToken))
        .send({
          name: 'API Platform',
          startDate: '2026-02-01',
          endDate: '2026-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.headers.location).toMatch(/^\/api\/projects\//);
      expect(response.body).toMatchObject({ name: 'API Platform' });
      expect(response.body.id).toBeDefined();
    });

    it('devuelve 400 con datos inválidos', async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set(authHeader(adminToken))
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Datos inválidos', errors: expect.any(Object) }),
      );
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set(authHeader(userToken))
        .send({
          name: 'API Platform',
          startDate: '2026-02-01',
          endDate: '2026-12-31',
        });

      expect(response.status).toBe(403);
    });

    it('devuelve 401 sin token', async () => {
      const response = await request(app.server).post('/api/projects').send({
        name: 'API Platform',
        startDate: '2026-02-01',
        endDate: '2026-12-31',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('devuelve 200 y actualiza el proyecto', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .put(`/api/projects/${id}`)
        .set(authHeader(adminToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id, name: 'Platform' });
    });

    it('devuelve 404 cuando el proyecto no existe', async () => {
      const response = await request(app.server)
        .put('/api/projects/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Proyecto no encontrado' });
    });

    it('devuelve 400 con cuerpo vacío', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .put(`/api/projects/${id}`)
        .set(authHeader(adminToken))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Datos inválidos');
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .put(`/api/projects/${id}`)
        .set(authHeader(userToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('devuelve 204 y elimina el proyecto', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .delete(`/api/projects/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(204);

      const found = await request(app.server)
        .get(`/api/projects/${id}`)
        .set(authHeader(adminToken));
      expect(found.status).toBe(404);
    });

    it('devuelve 404 cuando el proyecto no existe', async () => {
      const response = await request(app.server)
        .delete('/api/projects/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Proyecto no encontrado' });
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const id = await insertProject('API Platform');

      const response = await request(app.server)
        .delete(`/api/projects/${id}`)
        .set(authHeader(userToken));

      expect(response.status).toBe(403);
    });
  });
});
