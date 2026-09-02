import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodError } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createEmployeeDtoSchema,
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  updateEmployeeDtoSchema,
} from '../../application/dtos/employee.dto.js';
import { resolveBonusCalculator } from '../../infrastructure/di/container.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { EmployeeEntity } from '../../infrastructure/database/entities/employee.orm-entity.js';
import { TypeOrmEmployeeRepository } from '../../infrastructure/database/repositories/employee.repository.js';
import { EmployeeService } from '../../application/services/employee.service.js';

export async function employeeRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const employees = new TypeOrmEmployeeRepository(AppDataSource.getRepository(EmployeeEntity));
  const employeeService = new EmployeeService(employees, resolveBonusCalculator());

  fastify.get(
    '/api/employees',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (_request, reply) => {
      const employeesWithBonus = await employeeService.getAllWithBonus();
      return reply.code(200).send(employeesWithBonus);
    },
  );

  fastify.get(
    '/api/employees/:id',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const employee = await employeeService.getById(id);
      if (!employee) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(200).send(employee);
    },
  );

  fastify.post(
    '/api/employees',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      let input: CreateEmployeeDto;
      try {
        input = createEmployeeDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const employee = await employeeService.create(input);
      return reply.code(201).header('Location', `/api/employees/${employee.id}`).send(employee);
    },
  );

  fastify.put(
    '/api/employees/:id',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      let input: UpdateEmployeeDto;
      try {
        input = updateEmployeeDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const employee = await employeeService.update(id, input);
      if (!employee) {
        return reply.code(404).send({ message: 'Empleado no encontrado' });
      }
      return reply.code(200).send(employee);
    },
  );
}
