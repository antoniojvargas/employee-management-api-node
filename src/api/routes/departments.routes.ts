import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodError } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createDepartmentDtoSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
  updateDepartmentDtoSchema,
} from '../../application/dtos/department.dto.js';
import { DepartmentService } from '../../application/services/department.service.js';
import { EmployeeService } from '../../application/services/employee.service.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { DepartmentEntity } from '../../infrastructure/database/entities/department.orm-entity.js';
import { EmployeeEntity } from '../../infrastructure/database/entities/employee.orm-entity.js';
import { TypeOrmDepartmentRepository } from '../../infrastructure/database/repositories/department.repository.js';
import { TypeOrmEmployeeRepository } from '../../infrastructure/database/repositories/employee.repository.js';
import { resolveBonusCalculator } from '../../infrastructure/di/container.js';

export async function departmentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const departments = new TypeOrmDepartmentRepository(
    AppDataSource.getRepository(DepartmentEntity),
  );
  const departmentService = new DepartmentService(departments);

  const employees = new TypeOrmEmployeeRepository(AppDataSource.getRepository(EmployeeEntity));
  const employeeService = new EmployeeService(employees, resolveBonusCalculator());

  fastify.get(
    '/api/departments',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (_request, reply) => {
      const allDepartments = await departmentService.getAll();
      return reply.code(200).send(allDepartments);
    },
  );

  fastify.get(
    '/api/departments/:id',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const department = await departmentService.getById(id);
      if (!department) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }
      return reply.code(200).send(department);
    },
  );

  fastify.get(
    '/api/departments/:id/employees-with-projects',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const department = await departmentService.getById(id);
      if (!department) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }

      const employees = await employeeService.findByDepartmentWithProjects(id);
      return reply.code(200).send(employees);
    },
  );

  fastify.post(
    '/api/departments',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      let input: CreateDepartmentDto;
      try {
        input = createDepartmentDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const department = await departmentService.create(input);
      return reply
        .code(201)
        .header('Location', `/api/departments/${department.id}`)
        .send(department);
    },
  );

  fastify.put(
    '/api/departments/:id',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      let input: UpdateDepartmentDto;
      try {
        input = updateDepartmentDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const department = await departmentService.update(id, input);
      if (!department) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }
      return reply.code(200).send(department);
    },
  );

  fastify.delete(
    '/api/departments/:id',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await departmentService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }
      return reply.code(204).send();
    },
  );
}
