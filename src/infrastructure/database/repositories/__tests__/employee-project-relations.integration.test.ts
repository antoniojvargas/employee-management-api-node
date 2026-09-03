import 'reflect-metadata';
import { AppDataSource } from '../../data-source.js';
import { DepartmentEntity } from '../../entities/department.orm-entity.js';
import { EmployeeEntity } from '../../entities/employee.orm-entity.js';
import { ProjectEntity } from '../../entities/project.orm-entity.js';
import { TypeOrmDepartmentRepository } from '../department.repository.js';
import { TypeOrmEmployeeRepository } from '../employee.repository.js';
import { TypeOrmProjectRepository } from '../project.repository.js';

describe('Relación muchos-a-muchos empleados-proyectos (integración)', () => {
  let departmentRepo: TypeOrmDepartmentRepository;
  let employeeRepo: TypeOrmEmployeeRepository;
  let projectRepo: TypeOrmProjectRepository;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    departmentRepo = new TypeOrmDepartmentRepository(AppDataSource.getRepository(DepartmentEntity));
    employeeRepo = new TypeOrmEmployeeRepository(AppDataSource.getRepository(EmployeeEntity));
    projectRepo = new TypeOrmProjectRepository(AppDataSource.getRepository(ProjectEntity));
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    await AppDataSource.query('TRUNCATE TABLE "employee_projects" RESTART IDENTITY CASCADE');
    await AppDataSource.query('TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE');
    await AppDataSource.query('TRUNCATE TABLE "employees" RESTART IDENTITY CASCADE');
    await AppDataSource.query('TRUNCATE TABLE "departments" RESTART IDENTITY CASCADE');
  });

  async function joinRows(
    employeeId?: string,
  ): Promise<Array<{ employeesId: string; projectsId: string }>> {
    if (employeeId) {
      return AppDataSource.query(
        `SELECT "employeesId", "projectsId" FROM "employee_projects" WHERE "employeesId" = $1`,
        [employeeId],
      );
    }
    return AppDataSource.query(`SELECT "employeesId", "projectsId" FROM "employee_projects"`);
  }

  it('asigna un empleado a varios proyectos y los persiste en la tabla intermedia', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const projectA = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });
    const projectB = await projectRepo.create({
      name: 'Mobile App',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-11-30'),
    });

    await employeeRepo.assignToProject(employee.id, projectA.id);
    await employeeRepo.assignToProject(employee.id, projectB.id);

    const rows = await joinRows(employee.id);
    expect(rows).toHaveLength(2);

    const employees = await employeeRepo.findByDepartmentWithProjects(department.id);
    expect(employees).toHaveLength(1);
    const projectNames = employees[0].projects.map((p) => p.name);
    expect(projectNames).toEqual(expect.arrayContaining(['API Platform', 'Mobile App']));
  });

  it('asigna varios empleados al mismo proyecto', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const ada = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const alan = await employeeRepo.create({
      name: 'Alan Turing',
      currentPosition: 'Junior',
      salary: 4000,
      departmentId: department.id,
    });
    const project = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });

    await employeeRepo.assignToProject(ada.id, project.id);
    await employeeRepo.assignToProject(alan.id, project.id);

    const rows = await joinRows();
    expect(rows).toHaveLength(2);
    const employeeIds = rows.map((r) => r.employeesId);
    expect(employeeIds).toEqual(expect.arrayContaining([ada.id, alan.id]));
  });

  it('es idempotente: asignar dos veces no duplica el vínculo', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const project = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });

    await employeeRepo.assignToProject(employee.id, project.id);
    await employeeRepo.assignToProject(employee.id, project.id);

    const rows = await joinRows(employee.id);
    expect(rows).toHaveLength(1);
  });

  it('devuelve el empleado con sus proyectos en el resultado de assignToProject', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const project = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await employeeRepo.assignToProject(employee.id, project.id);

    expect(result.status).toBe('assigned');
    if (result.status === 'assigned') {
      expect(result.employee.id).toBe(employee.id);
      expect(result.employee.projects).toHaveLength(1);
      expect(result.employee.projects[0].name).toBe('API Platform');
      expect(result.employee.department?.id).toBe(department.id);
    }
  });

  it('remueve solo el vínculo indicado y conserva los demás', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const projectA = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });
    const projectB = await projectRepo.create({
      name: 'Mobile App',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-11-30'),
    });
    await employeeRepo.assignToProject(employee.id, projectA.id);
    await employeeRepo.assignToProject(employee.id, projectB.id);

    const removed = await employeeRepo.unassignFromProject(employee.id, projectA.id);

    expect(removed.status).toBe('removed');
    const rows = await joinRows(employee.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].projectsId).toBe(projectB.id);
  });

  it('unassign es idempotente cuando no existía el vínculo', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });
    const project = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });

    const removed = await employeeRepo.unassignFromProject(employee.id, project.id);

    expect(removed.status).toBe('removed');
    expect(await joinRows()).toHaveLength(0);
  });

  it('reporta employee-not-found si el empleado no existe al asignar', async () => {
    const project = await projectRepo.create({
      name: 'API Platform',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
    });

    const result = await employeeRepo.assignToProject(
      '00000000-0000-0000-0000-000000000000',
      project.id,
    );

    expect(result.status).toBe('employee-not-found');
  });

  it('reporta project-not-found si el proyecto no existe al asignar', async () => {
    const department = await departmentRepo.create({ name: 'Engineering' });
    const employee = await employeeRepo.create({
      name: 'Ada Lovelace',
      currentPosition: 'Regular',
      salary: 5000,
      departmentId: department.id,
    });

    const result = await employeeRepo.assignToProject(
      employee.id,
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result.status).toBe('project-not-found');
  });
});
