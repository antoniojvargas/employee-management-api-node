import type {
  CreateEmployeeDto,
  EmployeeDto,
  EmployeeWithDepartmentAndProjectsDto,
  UpdateEmployeeDto,
} from '../dtos/employee.dto.js';

export interface IEmployeeService {
  getById(id: string): Promise<EmployeeDto | null>;
  getAll(): Promise<EmployeeDto[]>;
  create(data: CreateEmployeeDto): Promise<EmployeeDto>;
  update(id: string, data: UpdateEmployeeDto): Promise<EmployeeDto | null>;
  delete(id: string): Promise<boolean>;
  findByDepartmentWithProjects(
    departmentId: string,
  ): Promise<EmployeeWithDepartmentAndProjectsDto[]>;
  calculateBonus(id: string): Promise<number>;
}
