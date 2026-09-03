import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ZodError } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createProjectDtoSchema,
  type CreateProjectDto,
  type UpdateProjectDto,
  updateProjectDtoSchema,
} from '../../application/dtos/project.dto.js';
import { ProjectService } from '../../application/services/project.service.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { ProjectEntity } from '../../infrastructure/database/entities/project.orm-entity.js';
import { TypeOrmProjectRepository } from '../../infrastructure/database/repositories/project.repository.js';

export async function projectRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const projects = new TypeOrmProjectRepository(AppDataSource.getRepository(ProjectEntity));
  const projectService = new ProjectService(projects);

  fastify.get(
    '/api/projects',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (_request, reply) => {
      const allProjects = await projectService.getAll();
      return reply.code(200).send(allProjects);
    },
  );

  fastify.get(
    '/api/projects/:id',
    { preHandler: fastify.requireRole(Roles.Admin, Roles.User) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const project = await projectService.getById(id);
      if (!project) {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(200).send(project);
    },
  );

  fastify.post(
    '/api/projects',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      let input: CreateProjectDto;
      try {
        input = createProjectDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const project = await projectService.create(input);
      return reply.code(201).header('Location', `/api/projects/${project.id}`).send(project);
    },
  );

  fastify.put(
    '/api/projects/:id',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      let input: UpdateProjectDto;
      try {
        input = updateProjectDtoSchema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.code(400).send({ message: 'Datos inválidos', errors: err.flatten() });
        }
        throw err;
      }

      const project = await projectService.update(id, input);
      if (!project) {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(200).send(project);
    },
  );

  fastify.delete(
    '/api/projects/:id',
    { preHandler: fastify.requireRole(Roles.Admin) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await projectService.delete(id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(204).send();
    },
  );
}
