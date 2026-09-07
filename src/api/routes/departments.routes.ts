import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createDepartmentDtoSchema,
  departmentDtoSchema,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
  updateDepartmentDtoSchema,
} from '../../application/dtos/department.dto.js';
import { employeeWithDepartmentAndProjectsDtoSchema } from '../../application/dtos/employee.dto.js';
import { DepartmentService } from '../../application/services/department.service.js';
import { EmployeeService } from '../../application/services/employee.service.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { DepartmentEntity } from '../../infrastructure/database/entities/department.orm-entity.js';
import { EmployeeEntity } from '../../infrastructure/database/entities/employee.orm-entity.js';
import { TypeOrmDepartmentRepository } from '../../infrastructure/database/repositories/department.repository.js';
import { TypeOrmEmployeeRepository } from '../../infrastructure/database/repositories/employee.repository.js';
import { resolveBonusCalculator } from '../../infrastructure/di/container.js';
import {
  idParamsSchema,
  messageErrorResponseSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
  toJsonSchema,
} from '../schemas/json-schema.js';

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

  const departmentResponseSchema = toJsonSchema(departmentDtoSchema);
  const departmentItemSchema = toJsonSchema(departmentDtoSchema);
  const departmentsPaginatedSchema = paginatedResponseSchema(departmentItemSchema);
  const employeesWithProjectsResponseSchema = toJsonSchema(
    z.array(employeeWithDepartmentAndProjectsDtoSchema),
  );
  const updateDepartmentBodySchema = {
    ...toJsonSchema(updateDepartmentDtoSchema),
    minProperties: 1,
  };

  fastify.get(
    '/api/departments',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema(),
        response: { 200: departmentsPaginatedSchema },
      },
    },
    async (request, reply) => {
      const allDepartments = await departmentService.getAllPaged(request.pagination);
      return reply.code(200).send(allDepartments);
    },
  );

  fastify.get(
    '/api/departments/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
          200: departmentResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
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
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
          200: employeesWithProjectsResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const department = await departmentService.getById(id);
      if (!department) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }

      const departmentEmployees = await employeeService.findByDepartmentWithProjects(id);
      return reply.code(200).send(departmentEmployees);
    },
  );

  fastify.post(
    '/api/departments',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        body: toJsonSchema(createDepartmentDtoSchema),
        response: { 201: departmentResponseSchema },
      },
    },
    async (request, reply) => {
      const input = request.body as CreateDepartmentDto;
      const department = await departmentService.create(input);
      return reply
        .code(201)
        .header('Location', `/api/departments/${department.id}`)
        .send(department);
    },
  );

  fastify.put(
    '/api/departments/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: updateDepartmentBodySchema,
        response: {
          200: departmentResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = request.body as UpdateDepartmentDto;
      const department = await departmentService.update(id, input);
      if (!department) {
        return reply.code(404).send({ message: 'Departamento no encontrado' });
      }
      return reply.code(200).send(department);
    },
  );

  fastify.delete(
    '/api/departments/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Departamentos'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
      },
    },
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
