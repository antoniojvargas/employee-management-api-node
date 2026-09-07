import { inject, injectable } from 'tsyringe';
import type { Department } from '../../domain/entities/department.js';
import type {
  CreateDepartmentData,
  IDepartmentRepository,
  UpdateDepartmentData,
} from '../repositories/department-repository.interface.js';
import type {
  CreateDepartmentDto,
  DepartmentDto,
  UpdateDepartmentDto,
} from '../dtos/department.dto.js';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationParams,
} from '../types/pagination.js';
import type { IDepartmentService } from './department-service.interface.js';
import { DepartmentRepositoryToken } from '../repositories/department-repository.token.js';

@injectable()
export class DepartmentService implements IDepartmentService {
  constructor(
    @inject(DepartmentRepositoryToken) private readonly departments: IDepartmentRepository,
  ) {}

  async getById(id: string): Promise<DepartmentDto | null> {
    const department = await this.departments.findById(id);
    return department ? this.toDepartmentDto(department) : null;
  }

  async getAll(): Promise<DepartmentDto[]> {
    const departments = await this.departments.findAll();
    return departments.map((department) => this.toDepartmentDto(department));
  }

  async getAllPaged(params: PaginationParams): Promise<PaginatedResult<DepartmentDto>> {
    const { items, total } = await this.departments.findAllPaginated(params);
    return buildPaginatedResult(
      items.map((department) => this.toDepartmentDto(department)),
      total,
      params.page,
      params.pageSize,
    );
  }

  async create(data: CreateDepartmentDto): Promise<DepartmentDto> {
    const department = await this.departments.create(this.toCreateData(data));
    return this.toDepartmentDto(department);
  }

  async update(id: string, data: UpdateDepartmentDto): Promise<DepartmentDto | null> {
    const department = await this.departments.update(id, this.toUpdateData(data));
    return department ? this.toDepartmentDto(department) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.departments.delete(id);
  }

  private toDepartmentDto(department: Department): DepartmentDto {
    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  private toCreateData(data: CreateDepartmentDto): CreateDepartmentData {
    return {
      name: data.name,
    };
  }

  private toUpdateData(data: UpdateDepartmentDto): UpdateDepartmentData {
    return {
      name: data.name,
    };
  }
}
