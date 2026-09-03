import type {
  CreateDepartmentDto,
  DepartmentDto,
  UpdateDepartmentDto,
} from '../dtos/department.dto.js';

export interface IDepartmentService {
  getById(id: string): Promise<DepartmentDto | null>;
  getAll(): Promise<DepartmentDto[]>;
  create(data: CreateDepartmentDto): Promise<DepartmentDto>;
  update(id: string, data: UpdateDepartmentDto): Promise<DepartmentDto | null>;
  delete(id: string): Promise<boolean>;
}
