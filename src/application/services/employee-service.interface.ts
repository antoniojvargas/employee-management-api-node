import type {
  CreateEmployeeDto,
  EmployeeDto,
  EmployeeWithBonusDto,
  EmployeeWithDepartmentAndProjectsDto,
  EmployeeWithPositionHistoryDto,
  UpdateEmployeeDto,
} from '../dtos/employee.dto.js';

export interface IEmployeeService {
  getById(id: string): Promise<EmployeeDto | null>;
  getByIdWithPositionHistory(id: string): Promise<EmployeeWithPositionHistoryDto | null>;
  getAll(): Promise<EmployeeDto[]>;
  getAllWithBonus(): Promise<EmployeeWithBonusDto[]>;
  create(data: CreateEmployeeDto): Promise<EmployeeDto>;
  update(id: string, data: UpdateEmployeeDto): Promise<EmployeeDto | null>;
  delete(id: string): Promise<boolean>;
  findByDepartmentWithProjects(
    departmentId: string,
  ): Promise<EmployeeWithDepartmentAndProjectsDto[]>;
  calculateBonus(id: string): Promise<number>;
}
