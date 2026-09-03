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

const makeEmployeeWithRelations = (
  overrides: Partial<EmployeeWithRelations> = {},
): EmployeeWithRelations => ({
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

function buildService(
  repo: Partial<IEmployeeRepository> = {},
  bonus: jest.Mock<number, [Employee]> = jest.fn().mockReturnValue(500),
) {
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
    calculateBonus: bonus as IBonusCalculator['calculateBonus'],
  };

  return { service: new EmployeeService(repository, calculator), repository, calculator };
}

describe('EmployeeService', () => {
  describe('mapeo de entidad a EmployeeDto', () => {
    it('mapea cada campo de la entidad al DTO en getAll', async () => {
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

    it('conserva departmentId null en el mapeo a DTO', async () => {
      const { service } = buildService({
        findAll: jest.fn().mockResolvedValue([makeEmployee({ departmentId: null })]),
      });

      const result = await service.getAll();

      expect(result[0].departmentId).toBeNull();
    });

    it('mapea la entidad al DTO en getById cuando existe', async () => {
      const { service, repository } = buildService({
        findById: jest.fn().mockResolvedValue(makeEmployee()),
      });

      await expect(service.getById('emp-1')).resolves.toEqual({
        id: 'emp-1',
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: 'dept-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.findById).toHaveBeenCalledWith('emp-1');
    });

    it('devuelve el DTO maplaceado tras create', async () => {
      const employee = makeEmployee({ id: 'emp-new', salary: 8000 });
      const { service, repository } = buildService({
        create: jest.fn().mockResolvedValue(employee),
      });

      const result = await service.create({
        name: 'Ada',
        currentPosition: 'SeniorManager',
        salary: 8000,
        departmentId: 'dept-1',
      });

      expect(result).toEqual({
        id: 'emp-new',
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 8000,
        departmentId: 'dept-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Ada',
        currentPosition: 'SeniorManager',
        salary: 8000,
        departmentId: 'dept-1',
      });
    });

    it('mapea el DTO actualizado tras update', async () => {
      const { service, repository } = buildService({
        update: jest.fn().mockResolvedValue(makeEmployee({ salary: 9000 })),
      });

      const result = await service.update('emp-1', { salary: 9000 });

      expect(result?.salary).toBe(9000);
      expect(repository.update).toHaveBeenCalledWith('emp-1', { salary: 9000 });
    });
  });

  describe('casos null', () => {
    it('devuelve null desde getById cuando no existe el empleado', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.getById('missing')).resolves.toBeNull();
    });

    it('devuelve una lista vacía desde getAll cuando no hay empleados', async () => {
      const { service } = buildService({ findAll: jest.fn().mockResolvedValue([]) });

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('devuelve null desde update cuando no existe el empleado', async () => {
      const { service } = buildService({ update: jest.fn().mockResolvedValue(null) });

      await expect(service.update('missing', { salary: 6000 })).resolves.toBeNull();
    });

    it('normaliza departmentId ausente a null al crear', async () => {
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

    it('no recorre departmentId ausente en update', async () => {
      const { service, repository } = buildService({
        update: jest.fn().mockResolvedValue(makeEmployee()),
      });

      await service.update('emp-1', { salary: 6000 });

      expect(repository.update).toHaveBeenCalledWith('emp-1', {
        salary: 6000,
        departmentId: undefined,
      });
    });

    it('mapea department null en la respuesta con relaciones', async () => {
      const { service } = buildService({
        findByDepartmentWithProjects: jest
          .fn()
          .mockResolvedValue([makeEmployeeWithRelations({ department: null })]),
      });

      const result = await service.findByDepartmentWithProjects('dept-1');

      expect(result[0].department).toBeNull();
      expect(result[0].projects).toHaveLength(1);
    });
  });

  describe('cálculo de bono delegado', () => {
    it('delega el cálculo de bono al calculador con la entidad completa', async () => {
      const bonus = jest.fn().mockReturnValue(250);
      const { service, repository, calculator } = buildService(
        { findById: jest.fn().mockResolvedValue(makeEmployee()) },
        bonus,
      );

      const result = await service.calculateBonus('emp-1');

      expect(result).toBe(250);
      expect(repository.findById).toHaveBeenCalledWith('emp-1');
      expect(calculator.calculateBonus).toHaveBeenCalledWith(makeEmployee());
    });

    it('lanza EmployeeNotFoundError cuando el empleado no existe', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      await expect(service.calculateBonus('missing')).rejects.toThrow(EmployeeNotFoundError);
      await expect(service.calculateBonus('missing')).rejects.toThrow(
        'Empleado con id "missing" no encontrado',
      );
    });

    it('incluye el id en el mensaje de EmployeeNotFoundError', async () => {
      const { service } = buildService({ findById: jest.fn().mockResolvedValue(null) });

      try {
        await service.calculateBonus('emp-desconocido');
        throw new Error('debería haber lanzado');
      } catch (error) {
        expect(error).toBeInstanceOf(EmployeeNotFoundError);
        expect((error as EmployeeNotFoundError).name).toBe('EmployeeNotFoundError');
        expect((error as EmployeeNotFoundError).message).toBe(
          'Empleado con id "emp-desconocido" no encontrado',
        );
      }
    });

    it('no llama al calculador cuando el empleado no existe', async () => {
      const bonus = jest.fn();
      const { service, calculator } = buildService(
        { findById: jest.fn().mockResolvedValue(null) },
        bonus,
      );

      await expect(service.calculateBonus('missing')).rejects.toThrow(EmployeeNotFoundError);
      expect(calculator.calculateBonus).not.toHaveBeenCalled();
    });
  });

  describe('getAllWithBonus', () => {
    it('calcula el bono de cada empleado usando el mismo valor devuelto por el calculador', async () => {
      const bonus = jest.fn().mockReturnValue(750);
      const { service, repository, calculator } = buildService(
        {
          findAll: jest
            .fn()
            .mockResolvedValue([
              makeEmployee(),
              makeEmployee({ id: 'emp-2', currentPosition: 'Manager', salary: 10000 }),
            ]),
        },
        bonus,
      );

      const result = await service.getAllWithBonus();

      expect(result).toEqual([
        {
          id: 'emp-1',
          name: 'Ada Lovelace',
          currentPosition: 'Regular',
          salary: 5000,
          departmentId: 'dept-1',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          bonus: 750,
        },
        {
          id: 'emp-2',
          name: 'Ada Lovelace',
          currentPosition: 'Manager',
          salary: 10000,
          departmentId: 'dept-1',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          bonus: 750,
        },
      ]);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(calculator.calculateBonus).toHaveBeenCalledTimes(2);
      expect(calculator.calculateBonus).toHaveBeenNthCalledWith(1, makeEmployee());
      expect(calculator.calculateBonus).toHaveBeenNthCalledWith(
        2,
        makeEmployee({ id: 'emp-2', currentPosition: 'Manager', salary: 10000 }),
      );
    });

    it('devuelve lista vacía cuando no hay empleados', async () => {
      const { service, calculator } = buildService({
        findAll: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAllWithBonus();

      expect(result).toEqual([]);
      expect(calculator.calculateBonus).not.toHaveBeenCalled();
    });

    it('propaga el bono según la posición de cada empleado', async () => {
      const { service } = buildService(
        {
          findAll: jest
            .fn()
            .mockResolvedValue([
              makeEmployee({ id: 'emp-1', currentPosition: 'Regular', salary: 1000 }),
              makeEmployee({ id: 'emp-2', currentPosition: 'Manager', salary: 1000 }),
              makeEmployee({ id: 'emp-3', currentPosition: 'SeniorManager', salary: 1000 }),
            ]),
        },
        jest.fn().mockImplementation((emp: Employee) => {
          if (emp.currentPosition === 'Manager') return 200;
          if (emp.currentPosition === 'SeniorManager') return 250;
          return 100;
        }),
      );

      const result = await service.getAllWithBonus();

      expect(result.map((e) => e.bonus)).toEqual([100, 200, 250]);
    });
  });

  describe('findByDepartmentWithProjects', () => {
    it('mapea las relaciones a EmployeeWithDepartmentAndProjectsDto', async () => {
      const { service, repository } = buildService({
        findByDepartmentWithProjects: jest.fn().mockResolvedValue([makeEmployeeWithRelations()]),
      });

      const result = await service.findByDepartmentWithProjects('dept-1');

      expect(repository.findByDepartmentWithProjects).toHaveBeenCalledWith('dept-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'emp-1',
        name: 'Ada Lovelace',
        currentPosition: 'Regular',
        salary: 5000,
        departmentId: 'dept-1',
      });
      expect(result[0].department?.name).toBe('Engineering');
      expect(result[0].projects).toHaveLength(1);
      expect(result[0].projects[0].name).toBe('API Platform');
    });

    it('devuelve lista vacía cuando no hay empleados en el departamento', async () => {
      const { service } = buildService({
        findByDepartmentWithProjects: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findByDepartmentWithProjects('dept-vacio');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('delega delete y devuelve true cuando se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(true) });

      await expect(service.delete('emp-1')).resolves.toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('emp-1');
    });

    it('delega delete y devuelve false cuando no se elimina', async () => {
      const { service, repository } = buildService({ delete: jest.fn().mockResolvedValue(false) });

      await expect(service.delete('emp-1')).resolves.toBe(false);
      expect(repository.delete).toHaveBeenCalledWith('emp-1');
    });
  });
});
