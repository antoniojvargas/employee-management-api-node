import 'reflect-metadata';
import { EmployeeService, EmployeeNotFoundError } from '../employee.service.js';
import type { IEmployeeRepository } from '../../repositories/employee-repository.interface.js';
import type { IBonusCalculator } from '../../bonuses/bonus-calculator.interface.js';
import type { Employee } from '../../../domain/entities/employee.js';
import type { EmployeeWithRelations } from '../../repositories/employee-repository.interface.js';

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  name: 'Ada Lovelace',
  currentPosition: 'Regular',
  salary: 5000,
  departmentId: 'dept-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

interface MockRepository extends IEmployeeRepository {
  findById: jest.Mock;
  findAll: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  findByDepartmentWithProjects: jest.Mock;
}

function buildService(repo: Partial<IEmployeeRepository> = {}, bonus = 500) {
  const repository: MockRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(false),
    findByDepartmentWithProjects: jest.fn().mockResolvedValue([]),
    ...repo,
  } as MockRepository;

  const calculator: IBonusCalculator = {
    calculateBonus: jest.fn().mockReturnValue(bonus),
  };

  return { service: new EmployeeService(repository, calculator), repository, calculator };
}

describe('EmployeeService', () => {
  describe('mapeo de entidad a EmployeeDto', () => {
    it('maps an employee entity to its DTO on getAll', async () => {
      const { service } = buildService({
        findAll: jest.fn().mockResolvedValue([makeEmployee()]),
      });

      const result = await service.getAll();

      expect(result).toEqual([
        {
          id: 'emp-1',
          name: 'Ada Lovelace',
          currentPosition: 'Regular',
          salary: 5000,
          departmentId: 'dept-1',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ]);
    });

    it('returns null from getById when the employee is not found', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.getById('missing')).resolves.toBeNull();
    });

    it('computes the bonus for every employee on getAllWithBonus', async () => {
      const { service, calculator } = buildService({
        findAll: jest.fn().mockResolvedValue([makeEmployee(), makeEmployee({ id: 'emp-2' })]),
      });
      calculator.calculateBonus = jest.fn().mockReturnValue(750) as never;

      const result = await service.getAllWithBonus();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'emp-1', salary: 5000, bonus: 750 });
      expect(calculator.calculateBonus).toHaveBeenCalledTimes(2);
    });

    it('returns the mapped DTO from getById when found', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(makeEmployee()) });

      await expect(service.getById('emp-1')).resolves.toEqual({
        id: 'emp-1',
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: 'dept-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
    });

    it('normalizes departmentId to null when creating without one', async () => {
      const { service, repository } = buildService({
        create: jest.fn().mockResolvedValue(makeEmployee({ departmentId: null })),
      });

      await service.create({ name: 'Ada', currentPosition: 'Regular', salary: 5000 });

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Ada',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: null,
      });
    });

    it('returns null from update when the employee is not found', async () => {
      const { service } = buildService({ update: jest.fn().mockResolvedValue(null) });

      await expect(service.update('emp-1', { salary: 6000 })).resolves.toBeNull();
    });

    it('delegates delete and returns its boolean result', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(true) });

      await expect(service.delete('emp-1')).resolves.toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('emp-1');
    });

    it('maps relations to EmployeeWithDepartmentAndProjectsDto', async () => {
      const employeeWithRelations: EmployeeWithRelations = {
        ...makeEmployee(),
        department: {
          id: 'dept-1',
          name: 'Engineering',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        projects: [
          {
            id: 'proj-1',
            name: 'API Platform',
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-12-31'),
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
          },
        ],
      };
      const { service } = buildService({
        findByDepartmentWithProjects: jest.fn().mockResolvedValue([employeeWithRelations]),
      });

      const result = await service.findByDepartmentWithProjects('dept-1');

      expect(result).toHaveLength(1);
      expect(result[0].department?.name).toBe('Engineering');
      expect(result[0].projects).toHaveLength(1);
    });
  });

  describe('cálculo de bono delegado', () => {
    it('loads the employee and delegates to IBonusCalculator', async () => {
      const { service, repository, calculator } = buildService({
        findById: jest.fn().mockResolvedValue(makeEmployee()),
      });

      await expect(service.calculateBonus('emp-1')).resolves.toBe(500);

      expect(repository.findById).toHaveBeenCalledWith('emp-1');
      expect(calculator.calculateBonus).toHaveBeenCalledWith(makeEmployee());
    });

    it('throws EmployeeNotFoundError when the employee does not exist', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.calculateBonus('missing')).rejects.toThrow(EmployeeNotFoundError);
    });
  });
});
