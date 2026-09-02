import type { DeleteResult, Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.orm-entity.js';
import { DepartmentEntity } from '../entities/department.orm-entity.js';
import { ProjectEntity } from '../entities/project.orm-entity.js';
import type { Department } from '../../../domain/entities/department.js';
import type { Employee } from '../../../domain/entities/employee.js';
import type { Project } from '../../../domain/entities/project.js';
import type {
  CreateEmployeeData,
  EmployeeWithRelations,
  IEmployeeRepository,
  UpdateEmployeeData,
} from '../../../application/repositories/employee-repository.interface.js';

export class TypeOrmEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly employees: Repository<EmployeeEntity>) {}

  async findById(id: string): Promise<Employee | null> {
    const entity = await this.employees.findOne({
      where: { id },
      relations: ['positionHistory'],
    });
    return entity ? this.toEmployee(entity) : null;
  }

  async findAll(): Promise<Employee[]> {
    const entities = await this.employees.find({ relations: ['positionHistory'] });
    return entities.map((entity) => this.toEmployee(entity));
  }

  async create(data: CreateEmployeeData): Promise<Employee> {
    const entity = this.employees.create(data);
    const saved = await this.employees.save(entity);
    return this.toEmployee(saved);
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee | null> {
    const result = await this.employees.update({ id }, data);
    if (!result.affected) return null;

    const entity = await this.employees.findOne({ where: { id } });
    return entity ? this.toEmployee(entity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result: DeleteResult = await this.employees.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async findByDepartmentWithProjects(departmentId: string): Promise<EmployeeWithRelations[]> {
    const entities = await this.employees.find({
      where: { departmentId },
      relations: ['department', 'projects', 'positionHistory'],
    });
    return entities.map((entity) => this.toEmployeeWithRelations(entity));
  }

  private toEmployee(entity: EmployeeEntity): Employee {
    return {
      id: entity.id,
      name: entity.name,
      currentPosition: entity.currentPosition,
      salary: Number(entity.salary),
      departmentId: entity.departmentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toEmployeeWithRelations(entity: EmployeeEntity): EmployeeWithRelations {
    return {
      ...this.toEmployee(entity),
      department: this.toDepartment(entity.department),
      projects: (entity.projects ?? []).map((project) => this.toProject(project)),
    };
  }

  private toDepartment(entity: DepartmentEntity | null): Department | null {
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toProject(entity: ProjectEntity): Project {
    return {
      id: entity.id,
      name: entity.name,
      startDate: entity.startDate,
      endDate: entity.endDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
