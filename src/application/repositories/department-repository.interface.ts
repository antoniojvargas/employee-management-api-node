import type { Department } from '../../domain/entities/department.js';
import type { PaginatedItems, PaginationParams } from '../types/pagination.js';

export interface CreateDepartmentData {
  name: string;
}

export interface UpdateDepartmentData {
  name?: string;
}

export interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  findAll(): Promise<Department[]>;
  findAllPaginated(params: PaginationParams): Promise<PaginatedItems<Department>>;
  create(data: CreateDepartmentData): Promise<Department>;
  update(id: string, data: UpdateDepartmentData): Promise<Department | null>;
  delete(id: string): Promise<boolean>;
}
