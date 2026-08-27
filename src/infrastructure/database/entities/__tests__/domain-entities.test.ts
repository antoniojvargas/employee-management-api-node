import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { DepartmentEntity } from '../../entities/department.orm-entity.js';
import { EmployeeEntity } from '../../entities/employee.orm-entity.js';
import { PositionHistoryEntity } from '../../entities/position-history.orm-entity.js';
import { ProjectEntity } from '../../entities/project.orm-entity.js';

function makeDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

describe('domain entities', () => {
  describe('instantiation', () => {
    it('instantiates EmployeeEntity with primitive fields', () => {
      const employee = new EmployeeEntity();
      employee.id = 'emp-1';
      employee.name = 'Ada Lovelace';
      employee.currentPosition = 'Manager';
      employee.salary = 80000;
      employee.departmentId = 'dept-1';
      employee.createdAt = makeDate('2026-01-01');
      employee.updatedAt = makeDate('2026-01-01');

      expect(employee.id).toBe('emp-1');
      expect(employee.name).toBe('Ada Lovelace');
      expect(employee.currentPosition).toBe('Manager');
      expect(employee.salary).toBe(80000);
      expect(employee.departmentId).toBe('dept-1');
      expect(employee.createdAt).toBeInstanceOf(Date);
      expect(employee.updatedAt).toBeInstanceOf(Date);
    });

    it('instantiates DepartmentEntity with primitive fields', () => {
      const department = new DepartmentEntity();
      department.id = 'dept-1';
      department.name = 'Engineering';
      department.createdAt = makeDate('2026-01-01');
      department.updatedAt = makeDate('2026-01-01');

      expect(department.id).toBe('dept-1');
      expect(department.name).toBe('Engineering');
      expect(department.createdAt).toBeInstanceOf(Date);
      expect(department.updatedAt).toBeInstanceOf(Date);
    });

    it('instantiates ProjectEntity with primitive fields', () => {
      const project = new ProjectEntity();
      project.id = 'proj-1';
      project.name = 'Migration to microservices';
      project.startDate = makeDate('2026-02-01');
      project.endDate = makeDate('2026-07-01');
      project.createdAt = makeDate('2026-01-15');
      project.updatedAt = makeDate('2026-01-15');

      expect(project.id).toBe('proj-1');
      expect(project.name).toBe('Migration to microservices');
      expect(project.startDate).toBeInstanceOf(Date);
      expect(project.endDate).toBeInstanceOf(Date);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('instantiates PositionHistoryEntity with primitive fields', () => {
      const history = new PositionHistoryEntity();
      history.id = 'hist-1';
      history.employeeId = 'emp-1';
      history.position = 'Senior Manager';
      history.startDate = makeDate('2026-03-01');
      history.endDate = makeDate('2026-09-01');
      history.createdAt = makeDate('2026-03-01');
      history.updatedAt = makeDate('2026-03-01');

      expect(history.id).toBe('hist-1');
      expect(history.employeeId).toBe('emp-1');
      expect(history.position).toBe('Senior Manager');
      expect(history.startDate).toBeInstanceOf(Date);
      expect(history.endDate).toBeInstanceOf(Date);
      expect(history.createdAt).toBeInstanceOf(Date);
      expect(history.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('relation typing', () => {
    it('EmployeeEntity.department is a singular ManyToOne to DepartmentEntity', () => {
      const employee = new EmployeeEntity();
      const department = new DepartmentEntity();
      department.name = 'Engineering';

      employee.department = department;
      employee.departmentId = department.id;

      expect(employee.department).toBeInstanceOf(DepartmentEntity);
      expect(employee.department).toBe(department);
    });

    it('EmployeeEntity.projects is a plural ManyToMany array of ProjectEntity', () => {
      const employee = new EmployeeEntity();
      const projectA = new ProjectEntity();
      projectA.id = 'proj-a';
      const projectB = new ProjectEntity();
      projectB.id = 'proj-b';

      employee.projects = [projectA, projectB];

      expect(Array.isArray(employee.projects)).toBe(true);
      expect(employee.projects).toHaveLength(2);
      employee.projects.forEach((project) => {
        expect(project).toBeInstanceOf(ProjectEntity);
      });
    });

    it('EmployeeEntity.positionHistory is a plural OneToMany array of PositionHistoryEntity', () => {
      const employee = new EmployeeEntity();
      const historyA = new PositionHistoryEntity();
      historyA.id = 'hist-a';
      const historyB = new PositionHistoryEntity();
      historyB.id = 'hist-b';

      employee.positionHistory = [historyA, historyB];

      expect(Array.isArray(employee.positionHistory)).toBe(true);
      expect(employee.positionHistory).toHaveLength(2);
      employee.positionHistory.forEach((history) => {
        expect(history).toBeInstanceOf(PositionHistoryEntity);
      });
    });

    it('DepartmentEntity.employees is a plural OneToMany array of EmployeeEntity', () => {
      const department = new DepartmentEntity();
      const employee = new EmployeeEntity();
      employee.id = 'emp-1';

      department.employees = [employee];

      expect(Array.isArray(department.employees)).toBe(true);
      expect(department.employees).toHaveLength(1);
      expect(department.employees[0]).toBeInstanceOf(EmployeeEntity);
    });

    it('ProjectEntity.employees is a plural ManyToMany array of EmployeeEntity', () => {
      const project = new ProjectEntity();
      const employee = new EmployeeEntity();
      employee.id = 'emp-1';

      project.employees = [employee];

      expect(Array.isArray(project.employees)).toBe(true);
      expect(project.employees).toHaveLength(1);
      expect(project.employees[0]).toBeInstanceOf(EmployeeEntity);
    });

    it('PositionHistoryEntity.employee is a singular ManyToOne to EmployeeEntity', () => {
      const history = new PositionHistoryEntity();
      const employee = new EmployeeEntity();
      employee.id = 'emp-1';

      history.employee = employee;
      history.employeeId = employee.id;

      expect(history.employee).toBeInstanceOf(EmployeeEntity);
      expect(history.employee).toBe(employee);
    });
  });

  describe('TypeORM metadata (isolated, no DB connection)', () => {
    const storage = getMetadataArgsStorage();

    it('registers EmployeeEntity with its relation metadata', () => {
      const target = EmployeeEntity;
      const relations = storage.relations.filter((r) => r.target === target);

      const names = relations.map((r) => r.propertyName);
      expect(names).toEqual(expect.arrayContaining(['department', 'projects', 'positionHistory']));
    });

    it('marks EmployeeEntity.department as ManyToOne', () => {
      const rel = storage.relations.find(
        (r) => r.target === EmployeeEntity && r.propertyName === 'department',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('many-to-one');
    });

    it('marks EmployeeEntity.projects as ManyToMany', () => {
      const rel = storage.relations.find(
        (r) => r.target === EmployeeEntity && r.propertyName === 'projects',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('many-to-many');
    });

    it('marks EmployeeEntity.positionHistory as OneToMany', () => {
      const rel = storage.relations.find(
        (r) => r.target === EmployeeEntity && r.propertyName === 'positionHistory',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('one-to-many');
    });

    it('marks DepartmentEntity.employees as OneToMany', () => {
      const rel = storage.relations.find(
        (r) => r.target === DepartmentEntity && r.propertyName === 'employees',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('one-to-many');
    });

    it('marks ProjectEntity.employees as ManyToMany', () => {
      const rel = storage.relations.find(
        (r) => r.target === ProjectEntity && r.propertyName === 'employees',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('many-to-many');
    });

    it('marks PositionHistoryEntity.employee as ManyToOne', () => {
      const rel = storage.relations.find(
        (r) => r.target === PositionHistoryEntity && r.propertyName === 'employee',
      );
      expect(rel).toBeDefined();
      expect(rel?.relationType).toBe('many-to-one');
    });

    it('declares the employee_projects join table on ProjectEntity', () => {
      const joinTable = storage.joinTables.find((j) => j.target === ProjectEntity);
      expect(joinTable).toBeDefined();
      expect(joinTable?.name).toBe('employee_projects');
    });

    it('declares an index on EmployeeEntity (department FK)', () => {
      const index = storage.indices.find((i) => i.target === EmployeeEntity);
      expect(index).toBeDefined();
    });

    it('declares an index on PositionHistoryEntity (employee FK)', () => {
      const index = storage.indices.find((i) => i.target === PositionHistoryEntity);
      expect(index).toBeDefined();
    });
  });
});
