import 'reflect-metadata';
import { DepartmentService } from '../department.service.js';
import type { IDepartmentRepository } from '../../repositories/department-repository.interface.js';
import type { Department } from '../../../domain/entities/department.js';

const makeDepartment = (overrides: Partial<Department> = {}): Department => ({
  id: 'dept-1',
  name: 'Engineering',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

interface MockRepository extends IDepartmentRepository {
  findById: jest.Mock;
  findAll: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildService(repo: Partial<IDepartmentRepository> = {}) {
  const repository: MockRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(false),
    ...repo,
  } as MockRepository;

  return { service: new DepartmentService(repository), repository };
}

describe('DepartmentService', () => {
  describe('mapeo de entidad a DepartmentDto', () => {
    it('mapea cada campo de la entidad al DTO en getAll', async () => {
      const { service } = buildService({
        findAll: jest.fn().mockResolvedValue([makeDepartment()]),
      });

      const result = await service.getAll();

      expect(result).toEqual([
        {
          id: 'dept-1',
          name: 'Engineering',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ]);
    });

    it('mapea la entidad al DTO en getById cuando existe', async () => {
      const { service, repository } = buildService({
        findById: jest.fn().mockResolvedValue(makeDepartment()),
      });

      await expect(service.getById('dept-1')).resolves.toEqual({
        id: 'dept-1',
        name: 'Engineering',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.findById).toHaveBeenCalledWith('dept-1');
    });

    it('devuelve el DTO maplaceado tras create', async () => {
      const department = makeDepartment({ id: 'dept-new', name: 'Design' });
      const { service, repository } = buildService({
        create: jest.fn().mockResolvedValue(department),
      });

      const result = await service.create({ name: 'Design' });

      expect(result).toEqual({
        id: 'dept-new',
        name: 'Design',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.create).toHaveBeenCalledWith({ name: 'Design' });
    });

    it('mapea el DTO actualizado tras update', async () => {
      const { service, repository } = buildService({
        update: jest.fn().mockResolvedValue(makeDepartment({ name: 'Platform' })),
      });

      const result = await service.update('dept-1', { name: 'Platform' });

      expect(result?.name).toBe('Platform');
      expect(repository.update).toHaveBeenCalledWith('dept-1', { name: 'Platform' });
    });
  });

  describe('casos null', () => {
    it('devuelve null desde getById cuando no existe el departamento', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.getById('missing')).resolves.toBeNull();
    });

    it('devuelve una lista vacía desde getAll cuando no hay departamentos', async () => {
      const { service } = buildService({ findAll: jest.fn().mockResolvedValue([]) });

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('devuelve null desde update cuando no existe el departamento', async () => {
      const { service } = buildService({ update: jest.fn().mockResolvedValue(null) });

      await expect(service.update('missing', { name: 'Platform' })).resolves.toBeNull();
    });
  });

  describe('delete', () => {
    it('delega delete y devuelve true cuando se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(true) });

      await expect(service.delete('dept-1')).resolves.toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('dept-1');
    });

    it('delega delete y devuelve false cuando no se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(false) });

      await expect(service.delete('dept-1')).resolves.toBe(false);
      expect(repository.delete).toHaveBeenCalledWith('dept-1');
    });
  });
});
