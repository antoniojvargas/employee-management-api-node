import 'reflect-metadata';
import request from 'supertest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../../test/helpers/build-app.js';
import { AppDataSource } from '../../../infrastructure/database/data-source.js';
import { runSeed } from '../../../infrastructure/database/seeders/seed.js';

describe('Flujo completo (e2e)', () => {
  let app: FastifyInstance;

  const userCredentials = { email: 'user.e2e@example.com', password: 'Password123' };
  const adminCredentials = { email: 'admin@example.com', password: 'Admin1234' };

  function authHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await AppDataSource.query('TRUNCATE TABLE "user_roles" RESTART IDENTITY CASCADE');
    await AppDataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    await AppDataSource.query('TRUNCATE TABLE "roles" RESTART IDENTITY CASCADE');
    await runSeed(AppDataSource);
    app = await buildApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it('registro, login y gestión completa de empleado como Admin (deniega la creación a User)', async () => {
    const register = await request(app.server).post('/api/auth/register').send(userCredentials);

    expect(register.status).toBe(201);
    expect(register.body.token).toBeDefined();
    expect(register.body.expiresAt).toBeDefined();

    const login = await request(app.server).post('/api/auth/login').send(userCredentials);

    expect(login.status).toBe(200);
    const userToken = login.body.token as string;
    expect(userToken).toBeDefined();

    const adminLogin = await request(app.server).post('/api/auth/login').send(adminCredentials);

    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.token as string;
    expect(adminToken).toBeDefined();

    const created = await request(app.server)
      .post('/api/employees')
      .set(authHeader(adminToken))
      .send({ name: 'Ada Lovelace', currentPosition: 'Regular', salary: 5000 });

    expect(created.status).toBe(201);
    const employeeId = created.body.id as string;
    expect(created.body).toMatchObject({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: null,
    });

    const denied = await request(app.server)
      .post('/api/employees')
      .set(authHeader(userToken))
      .send({ name: 'Grace Hopper', currentPosition: 'Regular', salary: 6000 });

    expect(denied.status).toBe(403);

    const found = await request(app.server)
      .get(`/api/employees/${employeeId}`)
      .set(authHeader(adminToken));

    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({
      id: employeeId,
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
    });

    const updated = await request(app.server)
      .put(`/api/employees/${employeeId}`)
      .set(authHeader(adminToken))
      .send({ currentPosition: 'Manager', salary: 9000 });

    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: employeeId,
      name: 'Ada Lovelace',
      currentPosition: 'Manager',
      salary: 9000,
    });

    const deleted = await request(app.server)
      .delete(`/api/employees/${employeeId}`)
      .set(authHeader(adminToken));

    expect(deleted.status).toBe(204);

    const afterDelete = await request(app.server)
      .get(`/api/employees/${employeeId}`)
      .set(authHeader(adminToken));

    expect(afterDelete.status).toBe(404);
  });
});
