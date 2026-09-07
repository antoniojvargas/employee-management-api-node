import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { Roles } from '../../application/constants/roles.js';
import {
  createProjectDtoSchema,
  projectDtoSchema,
  type CreateProjectDto,
  type UpdateProjectDto,
  updateProjectDtoSchema,
} from '../../application/dtos/project.dto.js';
import { ProjectService } from '../../application/services/project.service.js';
import { AppDataSource } from '../../infrastructure/database/data-source.js';
import { ProjectEntity } from '../../infrastructure/database/entities/project.orm-entity.js';
import { TypeOrmProjectRepository } from '../../infrastructure/database/repositories/project.repository.js';
import {
  idParamsSchema,
  messageErrorResponseSchema,
  toJsonSchema,
} from '../schemas/json-schema.js';

export async function projectRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const projects = new TypeOrmProjectRepository(AppDataSource.getRepository(ProjectEntity));
  const projectService = new ProjectService(projects);

  const projectResponseSchema = toJsonSchema(projectDtoSchema);
  const projectsListResponseSchema = toJsonSchema(z.array(projectDtoSchema));
  const updateProjectBodySchema = {
    ...toJsonSchema(updateProjectDtoSchema),
    minProperties: 1,
  };

  fastify.get(
    '/api/projects',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Proyectos'],
        response: { 200: projectsListResponseSchema },
      },
    },
    async (_request, reply) => {
      const allProjects = await projectService.getAll();
      return reply.code(200).send(allProjects);
    },
  );

  fastify.get(
    '/api/projects/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin, Roles.User),
      schema: {
        tags: ['Proyectos'],
        params: idParamsSchema,
        response: {
          200: projectResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
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
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Proyectos'],
        body: toJsonSchema(createProjectDtoSchema),
        response: { 201: projectResponseSchema },
      },
    },
    async (request, reply) => {
      const body = request.body as CreateProjectDto;
      const input: CreateProjectDto = {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      };
      const project = await projectService.create(input);
      return reply.code(201).header('Location', `/api/projects/${project.id}`).send(project);
    },
  );

  fastify.put(
    '/api/projects/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Proyectos'],
        params: idParamsSchema,
        body: updateProjectBodySchema,
        response: {
          200: projectResponseSchema,
          404: messageErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateProjectDto;
      const input: UpdateProjectDto = { ...body };
      if (body.startDate !== undefined) input.startDate = new Date(body.startDate);
      if (body.endDate !== undefined) input.endDate = new Date(body.endDate);
      const project = await projectService.update(id, input);
      if (!project) {
        return reply.code(404).send({ message: 'Proyecto no encontrado' });
      }
      return reply.code(200).send(project);
    },
  );

  fastify.delete(
    '/api/projects/:id',
    {
      preHandler: fastify.requireRole(Roles.Admin),
      schema: {
        tags: ['Proyectos'],
        params: idParamsSchema,
      },
    },
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
