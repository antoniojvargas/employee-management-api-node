import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createEmployeeDtoSchema,
  createPositionHistoryDtoSchema,
  employeeDtoSchema,
  employeeWithBonusDtoSchema,
  employeeWithDepartmentAndProjectsDtoSchema,
  positionHistoryDtoSchema,
  type CreateEmployeeDto,
  type CreatePositionHistoryDto,
  type UpdateEmployeeDto,
  updateEmployeeDtoSchema,
} from '../../application/dtos/employee.dto.js';
import { ValidationError } from '../../application/errors/index.js';
import { resolveBonusCalculator } from '../../infrastructure/di/container.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { EmployeeEntity } from '../../infrastructure/database/entities/employee.orm-entity.js';
import { TypeOrmEmployeeRepository } from '../../infrastructure/database/repositories/employee.repository.js';
import { EmployeeService } from '../../application/services/employee.service.js';
import {
  idAndProjectIdParamsSchema,
  idParamsSchema,
  messageErrorResponseSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
  toJsonSchema,
} from '../schemas/json-schema.js';

export async function employeeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const employees = new TypeOrmEmployeeRepository(AppDataSource.getRepository(EmployeeEntity));
  const employeeService = new EmployeeService(employees, resolveBonusCalculator());

  const employeeResponseSchema = toJsonSchema(employeeDtoSchema);
  const employeeWithBonusItemSchema = toJsonSchema(employeeWithBonusDtoSchema);
  const employeesWithBonusPaginatedSchema = paginatedResponseSchema(employeeWithBonusItemSchema);
  const positionHistoryListResponseSchema = toJsonSchema(z.array(positionHistoryDtoSchema));
  const positionHistoryResponseSchema = toJsonSchema(positionHistoryDtoSchema);
  const employeeWithDepartmentAndProjectsResponseSchema = toJsonSchema(
    employeeWithDepartmentAndProjectsDtoSchema,
  );
  const createPositionHistoryBodySchema = toJsonSchema(createPositionHistoryDtoSchema);
  const updateEmployeeBodySchema = {
    ...toJsonSchema(updateEmployeeDtoSchema),
    minProperties: 1,
  };

  fastify.get(
    '/api/employees',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema(),
        response: { 200: employeesWithBonusPaginatedSchema },
      },
    },
    async (request, reply) => {
      const employeesWithBonus = await employeeService.getAllWithBonusPaged(request.pagination);
      return reply.code(200).send(employeesWithBonus);
    },
  );

  fastify.get(
    '/api/employees/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
          200: employeeResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const employee = await employeeService.getById(id);
      if (!employee) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(200).send(employee);
    },
  );

  fastify.get(
    '/api/employees/:id/position-history',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        response: {
          200: positionHistoryListResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const employee = await employeeService.getByIdWithPositionHistory(id);
      if (!employee) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(200).send(employee.positionHistory);
    },
  );

  fastify.post(
    '/api/employees/:id/position-history',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: createPositionHistoryBodySchema,
        response: {
          201: positionHistoryResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as CreatePositionHistoryDto;
      const input: CreatePositionHistoryDto = {
        position: body.position,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      };

      if (input.startDate > input.endDate) {
        throw new ValidationError('El endDate debe ser mayor o igual al startDate');
      }

      const history = await employeeService.createPositionHistory(id, input);
      if (!history) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply
        .code(201)
        .header('Location', `/api/employees/${id}/position-history`)
        .send(history);
    },
  );

  fastify.post(
    '/api/employees/:id/projects/:projectId',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idAndProjectIdParamsSchema,
        response: {
          201: employeeWithDepartmentAndProjectsResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id, projectId } = request.params as { id: string; projectId: string };

      const result = await employeeService.assignToProject(id, projectId);
      if (result.status === 'employee-not-found') {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      if (result.status === 'project-not-found') {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(201).header('Location', `/api/projects/${projectId}`).send(result.employee);
    },
  );

  fastify.delete(
    '/api/employees/:id/projects/:projectId',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idAndProjectIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id, projectId } = request.params as { id: string; projectId: string };

      const result = await employeeService.unassignFromProject(id, projectId);
      if (result.status === 'employee-not-found') {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      if (result.status === 'project-not-found') {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(204).send();
    },
  );

  fastify.post(
    '/api/employees',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        body: toJsonSchema(createEmployeeDtoSchema),
        response: { 201: employeeResponseSchema },
      },
    },
    async (request, reply) => {
      const input = request.body as CreateEmployeeDto;
      const employee = await employeeService.create(input);
      return reply.code(201).header('Location', `/api/employees/${employee.id}`).send(employee);
    },
  );

  fastify.put(
    '/api/employees/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: updateEmployeeBodySchema,
        response: {
          200: employeeResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = request.body as UpdateEmployeeDto;
      const employee = await employeeService.update(id, input);
      if (!employee) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(200).send(employee);
    },
  );

  fastify.delete(
    '/api/employees/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Empleados'],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await employeeService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(204).send();
    },
  );
}
