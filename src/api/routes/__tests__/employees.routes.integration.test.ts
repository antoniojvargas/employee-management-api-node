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

async function insertEmployee(employee: {
  name: string;
  currentPosition: string;
  salary: number;
  departmentId: string | null;
}): Promise<{ id: string; departmentId: string | null }> {
  const result = await AppDataSource.query(
    `INSERT INTO "employees" (name, current_position, salary, department_id)
     VALUES ($1, $2, $3, $4) RETURNING id, department_id`,
    [employee.name, employee.currentPosition, employee.salary, employee.departmentId],
  );
  return { id: result[0].id, departmentId: result[0].department_id };
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

describe('Employee routes (integración)', () => {
  describe('GET /api/employees', () => {
    it('devuelve 200 con los empleados y su bono calculado', async () => {
      const deptId = await insertDepartment('Engineering');
      await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Manager',
        salary: 10000,
        departmentId: deptId,
      });
      await insertEmployee({
        name: 'Alan Turing',
        currentPosition: 'Regular',
        salary: 4000,
        departmentId: deptId,
      });

      const response = await request(app.server).get('/api/employees').set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      const ada = response.body.find((e: { name: string }) => e.name === 'Ada Lovelace');
      expect(ada).toMatchObject({
        name: 'Ada Lovelace',
        currentPosition: 'Manager',
        salary: 10000,
        departmentId: deptId,
        bonus: 2000,
      });
      expect(ada).not.toHaveProperty('department');
      expect(ada).not.toHaveProperty('projects');
    });

    it('devuelve 200 con lista vacía cuando no hay empleados', async () => {
      const response = await request(app.server).get('/api/employees').set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('permite acceso a usuarios con rol User', async () => {
      await insertDepartment('Engineering');
      await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server).get('/api/employees').set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('devuelve 401 sin token de autorización', async () => {
      const response = await request(app.server).get('/api/employees');

      expect(response.status).toBe(401);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/employees/:id', () => {
    it('devuelve 200 con el empleado encontrado', async () => {
      const deptId = await insertDepartment('Engineering');
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });

      const response = await request(app.server)
        .get(`/api/employees/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id,
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });
    });

    it('devuelve 404 cuando el empleado no existe', async () => {
      const response = await request(app.server)
        .get('/api/employees/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Empleado no encontrado' });
    });

    it('devuelve 401 sin token', async () => {
      const response = await request(app.server).get(
        '/api/employees/00000000-0000-0000-0000-000000000000',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/employees', () => {
    it('devuelve 201 y crea el empleado', async () => {
      const deptId = await insertDepartment('Engineering');
      const body = {
        name: 'Grace Hopper',
        currentPosition: 'SeniorManager',
        salary: 12000,
        departmentId: deptId,
      };

      const response = await request(app.server)
        .post('/api/employees')
        .set(authHeader(adminToken))
        .send(body);

      expect(response.status).toBe(201);
      expect(response.headers.location).toMatch(/^\/api\/employees\//);
      expect(response.body).toMatchObject({
        name: 'Grace Hopper',
        currentPosition: 'SeniorManager',
        salary: 12000,
        departmentId: deptId,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body).not.toHaveProperty('bonus');
    });

    it('devuelve 201 y crea el empleado sin departamento', async () => {
      const response = await request(app.server)
        .post('/api/employees')
        .set(authHeader(adminToken))
        .send({ name: 'Grace Hopper', currentPosition: 'Regular', salary: 5000 });

      expect(response.status).toBe(201);
      expect(response.body.departmentId).toBeNull();
    });

    it('devuelve 400 con datos inválidos', async () => {
      const response = await request(app.server)
        .post('/api/employees')
        .set(authHeader(adminToken))
        .send({ name: '', currentPosition: 'Regular', salary: 5000 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Datos inválidos', errors: expect.any(Object) }),
      );
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const response = await request(app.server)
        .post('/api/employees')
        .set(authHeader(userToken))
        .send({ name: 'Grace Hopper', currentPosition: 'Regular', salary: 5000 });

      expect(response.status).toBe(403);
    });

    it('devuelve 401 sin token', async () => {
      const response = await request(app.server)
        .post('/api/employees')
        .send({ name: 'Grace Hopper', currentPosition: 'Regular', salary: 5000 });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('devuelve 200 y actualiza el empleado', async () => {
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server)
        .put(`/api/employees/${id}`)
        .set(authHeader(adminToken))
        .send({ salary: 9000, currentPosition: 'Manager' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id,
        name: 'Ada Lovelace',
        currentPosition: 'Manager',
        salary: 9000,
      });
    });

    it('devuelve 404 cuando el empleado no existe', async () => {
      const response = await request(app.server)
        .put('/api/employees/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .send({ salary: 9000 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Empleado no encontrado' });
    });

    it('devuelve 400 con cuerpo vacío', async () => {
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server)
        .put(`/api/employees/${id}`)
        .set(authHeader(adminToken))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Datos inválidos');
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server)
        .put(`/api/employees/${id}`)
        .set(authHeader(userToken))
        .send({ salary: 9000 });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('devuelve 204 y elimina el empleado', async () => {
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server)
        .delete(`/api/employees/${id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(204);

      const found = await request(app.server)
        .get(`/api/employees/${id}`)
        .set(authHeader(adminToken));
      expect(found.status).toBe(404);
    });

    it('devuelve 404 cuando el empleado no existe', async () => {
      const response = await request(app.server)
        .delete('/api/employees/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Empleado no encontrado' });
    });

    it('devuelve 403 para usuario sin rol Admin', async () => {
      const { id } = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });

      const response = await request(app.server)
        .delete(`/api/employees/${id}`)
        .set(authHeader(userToken));

      expect(response.status).toBe(403);
    });
  });
});
