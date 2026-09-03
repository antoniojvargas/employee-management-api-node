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

async function insertProject(name: string): Promise<string> {
  const result = await AppDataSource.query(
    `INSERT INTO "projects" (name, start_date, end_date)
     VALUES ($1, $2, $3) RETURNING id`,
    [name, '2026-02-01', '2026-12-31'],
  );
  return result[0].id;
}

async function linkEmployeeToProject(employeeId: string, projectId: string): Promise<void> {
  await AppDataSource.query(
    `INSERT INTO "employee_projects" ("employeesId", "projectsId") VALUES ($1, $2)`,
    [employeeId, projectId],
  );
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

  describe('GET /api/departments/:id/employees-with-projects', () => {
    it('devuelve solo los empleados del departamento que tienen al menos un proyecto', async () => {
      const deptId = await insertDepartment('Engineering');
      const projectId = await insertProject('API Platform');
      const empWithProject = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });
      await insertEmployee({
        name: 'Alan Turing',
        currentPosition: 'Junior',
        salary: 4000,
        departmentId: deptId,
      });
      await linkEmployeeToProject(empWithProject.id, projectId);

      const response = await request(app.server)
        .get(`/api/departments/${deptId}/employees-with-projects`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: empWithProject.id,
        name: 'Ada Lovelace',
        departmentId: deptId,
      });
      expect(response.body[0].projects).toHaveLength(1);
      expect(response.body[0].projects[0].name).toBe('API Platform');
      expect(response.body[0].department?.id).toBe(deptId);
    });

    it('incluye todos los proyectos de un empleado', async () => {
      const deptId = await insertDepartment('Engineering');
      const projectA = await insertProject('API Platform');
      const projectB = await insertProject('Mobile App');
      const emp = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });
      await linkEmployeeToProject(emp.id, projectA);
      await linkEmployeeToProject(emp.id, projectB);

      const response = await request(app.server)
        .get(`/api/departments/${deptId}/employees-with-projects`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].projects).toHaveLength(2);
      const names = response.body[0].projects.map((p: { name: string }) => p.name);
      expect(names).toEqual(expect.arrayContaining(['API Platform', 'Mobile App']));
    });

    it('no mezcla empleados de otros departamentos', async () => {
      const deptA = await insertDepartment('Engineering');
      const deptB = await insertDepartment('Design');
      const projectId = await insertProject('API Platform');
      const empInA = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptA,
      });
      const empInB = await insertEmployee({
        name: 'Grace Hopper',
        currentPosition: 'Senior',
        salary: 7000,
        departmentId: deptB,
      });
      await linkEmployeeToProject(empInA.id, projectId);
      await linkEmployeeToProject(empInB.id, projectId);

      const response = await request(app.server)
        .get(`/api/departments/${deptA}/employees-with-projects`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(empInA.id);
    });

    it('devuelve lista vacía cuando no hay empleados con proyectos', async () => {
      const deptId = await insertDepartment('Engineering');
      await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });

      const response = await request(app.server)
        .get(`/api/departments/${deptId}/employees-with-projects`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('devuelve 404 cuando el departamento no existe', async () => {
      const response = await request(app.server)
        .get('/api/departments/00000000-0000-0000-0000-000000000000/employees-with-projects')
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Departamento no encontrado' });
    });

    it('permite acceso a usuarios con rol User', async () => {
      const deptId = await insertDepartment('Engineering');
      const projectId = await insertProject('API Platform');
      const emp = await insertEmployee({
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: deptId,
      });
      await linkEmployeeToProject(emp.id, projectId);

      const response = await request(app.server)
        .get(`/api/departments/${deptId}/employees-with-projects`)
        .set(authHeader(userToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('devuelve 401 sin token de autorización', async () => {
      const deptId = await insertDepartment('Engineering');

      const response = await request(app.server).get(
        `/api/departments/${deptId}/employees-with-projects`,
      );

      expect(response.status).toBe(401);
    });
  });
});
