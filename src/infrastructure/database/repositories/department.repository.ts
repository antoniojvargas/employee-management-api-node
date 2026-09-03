import type { DeleteResult, Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.orm-entity.js';
import type { Department } from '../../../domain/entities/department.js';
import type {
  CreateDepartmentData,
  IDepartmentRepository,
  UpdateDepartmentData,
} from '../../../application/repositories/department-repository.interface.js';

export class TypeOrmDepartmentRepository implements IDepartmentRepository {
  constructor(private readonly departments: Repository<DepartmentEntity>) {}

  async findById(id: string): Promise<Department | null> {
    const entity = await this.departments.findOne({ where: { id } });
    return entity ? this.toDepartment(entity) : null;
  }

  async findAll(): Promise<Department[]> {
    const entities = await this.departments.find();
    return entities.map((entity) => this.toDepartment(entity));
  }

  async create(data: CreateDepartmentData): Promise<Department> {
    const entity = this.departments.create(data);
    const saved = await this.departments.save(entity);
    return this.toDepartment(saved);
  }

  async update(id: string, data: UpdateDepartmentData): Promise<Department | null> {
    const result = await this.departments.update({ id }, data);
    if (!result.affected) return null;

    const entity = await this.departments.findOne({ where: { id } });
    return entity ? this.toDepartment(entity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result: DeleteResult = await this.departments.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toDepartment(entity: DepartmentEntity): Department {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
