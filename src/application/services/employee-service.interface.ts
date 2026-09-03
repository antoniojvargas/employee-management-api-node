import type {
  CreateEmployeeDto,
  CreatePositionHistoryDto,
  EmployeeDto,
  EmployeeWithBonusDto,
  EmployeeWithDepartmentAndProjectsDto,
  EmployeeWithPositionHistoryDto,
  PositionHistoryDto,
  UpdateEmployeeDto,
} from '../dtos/employee.dto.js';

export interface IEmployeeService {
  getById(id: string): Promise<EmployeeDto | null>;
  getByIdWithPositionHistory(id: string): Promise<EmployeeWithPositionHistoryDto | null>;
  createPositionHistory(
    employeeId: string,
    data: CreatePositionHistoryDto,
  ): Promise<PositionHistoryDto | null>;
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
