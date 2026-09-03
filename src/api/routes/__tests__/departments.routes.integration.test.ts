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
  await AppDataSource.query('TRUNCATE TABLE "employees" RESTART IDENTITY CASCADE');
  await AppDataSource.query('TRUNCATE TABLE "departments" RESTART IDENTITY CASCADE');
}

async function insertDepartment(name: string): Promise<string> {
  const result = await AppDataSource.query(
    `INSERT INTO "departments" (name) VALUES ($1) RETURNING id`,
    [name],
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

describe('Department routes (integración)', () => {
  describe('GET /api/departments', () => {
    it('devuelve 200 con todos los departamentos', async () => {
      await insertDepartment('Engineering');
      await insertDepartment('Design');

      const response = await request(app.server)
        .get('/api/departments')
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      const names = response.body.map((d: { name: string }) => d.name);
      expect(names).toEqual(expect.arrayContaining(['Engineering', 'Design']));
    });

    it('devuelve 200 con lista vacía cuando no hay departamentos', async () => {
      const response = await request(app.server)
        .get('/api/departments')
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('permite acceso a usuarios con rol User', async () => {
      await insertDepartment('Engineering');

      const response = await request(app.server).get('/api/departments').set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('devuelve 401 sin token de autorización', async () => {
      const response = await request(app.server).get('/api/departments');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/departments/:id', () => {
    it('devuelve 200 con el departamento encontrado', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .get(`/api/departments/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id,
        name: 'Engineering',
      });
      expect(response.body.createdAt).toBeDefined();
    });

    it('devuelve 404 cuando el departamento no existe', async () => {
      const response = await request(app.server)
        .get('/api/departments/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Departamento no encontrado' });
    });

    it('permite lectura a usuarios con rol User', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .get(`/api/departments/${id}`)
        .set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Engineering');
    });
  });

  describe('POST /api/departments', () => {
    it('devuelve 201 y crea el departamento', async () => {
      const response = await request(app.server)
        .post('/api/departments')
        .set(authHeader(adminToken))
        .send({ name: 'Engineering' });

      expect(response.status).toBe(201);
      expect(response.headers.location).toMatch(/^\/api\/departments\//);
      expect(response.body).toMatchObject({ name: 'Engineering' });
      expect(response.body.id).toBeDefined();
    });

    it('devuelve 400 con nombre inválido', async () => {
      const response = await request(app.server)
        .post('/api/departments')
        .set(authHeader(adminToken))
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Datos inválidos', errors: expect.any(Object) }),
      );
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const response = await request(app.server)
        .post('/api/departments')
        .set(authHeader(userToken))
        .send({ name: 'Engineering' });

      expect(response.status).toBe(403);
    });

    it('devuelve 401 sin token', async () => {
      const response = await request(app.server)
        .post('/api/departments')
        .send({ name: 'Engineering' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/departments/:id', () => {
    it('devuelve 200 y actualiza el departamento', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .put(`/api/departments/${id}`)
        .set(authHeader(adminToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id, name: 'Platform' });
    });

    it('devuelve 404 cuando el departamento no existe', async () => {
      const response = await request(app.server)
        .put('/api/departments/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Departamento no encontrado' });
    });

    it('devuelve 400 con cuerpo vacío', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .put(`/api/departments/${id}`)
        .set(authHeader(adminToken))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Datos inválidos');
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .put(`/api/departments/${id}`)
        .set(authHeader(userToken))
        .send({ name: 'Platform' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/departments/:id', () => {
    it('devuelve 204 y elimina el departamento', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .delete(`/api/departments/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(204);

      const found = await request(app.server)
        .get(`/api/departments/${id}`)
        .set(authHeader(adminToken));
      expect(found.status).toBe(404);
    });

    it('devuelve 404 cuando el departamento no existe', async () => {
      const response = await request(app.server)
        .delete('/api/departments/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Departamento no encontrado' });
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const id = await insertDepartment('Engineering');

      const response = await request(app.server)
        .delete(`/api/departments/${id}`)
        .set(authHeader(userToken));

      expect(response.status).toBe(403);
    });
  });
});
