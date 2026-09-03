import 'reflect-metadata';
import { ProjectService } from '../project.service.js';
import type { IProjectRepository } from '../../repositories/project-repository.interface.js';
import type { Project } from '../../../domain/entities/project.js';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'API Platform',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-12-31'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

interface MockRepository extends IProjectRepository {
  findById: jest.Mock;
  findAll: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildService(repo: Partial<IProjectRepository> = {}) {
  const repository: MockRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(false),
    ...repo,
  } as MockRepository;

  return { service: new ProjectService(repository), repository };
}

describe('ProjectService', () => {
  describe('mapeo de entidad a ProjectDto', () => {
    it('mapea cada campo de la entidad al DTO en getAll', async () => {
      const { service } = buildService({
        findAll: jest.fn().mockResolvedValue([makeProject()]),
      });

      const result = await service.getAll();

      expect(result).toEqual([
        {
          id: 'proj-1',
          name: 'API Platform',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-12-31'),
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ]);
    });

    it('mapea la entidad al DTO en getById cuando existe', async () => {
      const { service, repository } = buildService({
        findById: jest.fn().mockResolvedValue(makeProject()),
      });

      await expect(service.getById('proj-1')).resolves.toEqual({
        id: 'proj-1',
        name: 'API Platform',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.findById).toHaveBeenCalledWith('proj-1');
    });

    it('devuelve el DTO maplaceado tras create', async () => {
      const { service, repository } = buildService({
        create: jest.fn().mockResolvedValue(
          makeProject({
            id: 'proj-new',
            name: 'Mobile App',
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-11-30'),
          }),
        ),
      });

      const result = await service.create({
        name: 'Mobile App',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-11-30'),
      });

      expect(result).toEqual({
        id: 'proj-new',
        name: 'Mobile App',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-11-30'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Mobile App',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-11-30'),
      });
    });

    it('mapea el DTO actualizado tras update', async () => {
      const { service, repository } = buildService({
        update: jest.fn().mockResolvedValue(makeProject({ name: 'Platform' })),
      });

      const result = await service.update('proj-1', { name: 'Platform' });

      expect(result?.name).toBe('Platform');
      expect(repository.update).toHaveBeenCalledWith('proj-1', { name: 'Platform' });
    });
  });

  describe('casos null', () => {
    it('devuelve null desde getById cuando no existe el proyecto', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.getById('missing')).resolves.toBeNull();
    });

    it('devuelve una lista vacía desde getAll cuando no hay proyectos', async () => {
      const { service } = buildService({ findAll: jest.fn().mockResolvedValue([]) });

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('devuelve null desde update cuando no existe el proyecto', async () => {
      const { service } = buildService({ update: jest.fn().mockResolvedValue(null) });

      await expect(service.update('missing', { name: 'Platform' })).resolves.toBeNull();
    });
  });

  describe('delete', () => {
    it('delega delete y devuelve true cuando se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(true) });

      await expect(service.delete('proj-1')).resolves.toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('proj-1');
    });

    it('delega delete y devuelve false cuando no se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(false) });

      await expect(service.delete('proj-1')).resolves.toBe(false);
      expect(repository.delete).toHaveBeenCalledWith('proj-1');
    });
  });
});
