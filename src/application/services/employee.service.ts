import { inject, injectable } from 'tsyringe';
import type { Employee } from '../../domain/entities/employee.js';
import type { EmployeeWithRelations } from '../repositories/employee-repository.interface.js';
import type {
  IEmployeeRepository,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../repositories/employee-repository.interface.js';
import type { IBonusCalculator } from '../bonuses/bonus-calculator.interface.js';
import type {
  CreateEmployeeDto,
  EmployeeDto,
  EmployeeWithDepartmentAndProjectsDto,
  UpdateEmployeeDto,
} from '../dtos/employee.dto.js';
import type { IEmployeeService } from './employee-service.interface.js';
import { EmployeeRepositoryToken } from '../repositories/employee-repository.token.js';
import { BonusCalculatorToken } from '../bonuses/bonus-calculator.token.js';

@injectable()
export class EmployeeService implements IEmployeeService {
  constructor(
    @inject(EmployeeRepositoryToken) private readonly employees: IEmployeeRepository,
    @inject(BonusCalculatorToken) private readonly bonusCalculator: IBonusCalculator,
  ) {}

  async getById(id: string): Promise<EmployeeDto | null> {
    const employee = await this.employees.findById(id);
    return employee ? this.toEmployeeDto(employee) : null;
  }

  async getAll(): Promise<EmployeeDto[]> {
    const employees = await this.employees.findAll();
    return employees.map((employee) => this.toEmployeeDto(employee));
  }

  async create(data: CreateEmployeeDto): Promise<EmployeeDto> {
    const employee = await this.employees.create(this.toCreateData(data));
    return this.toEmployeeDto(employee);
  }

  async update(id: string, data: UpdateEmployeeDto): Promise<EmployeeDto | null> {
    const employee = await this.employees.update(id, this.toUpdateData(data));
    return employee ? this.toEmployeeDto(employee) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  async findByDepartmentWithProjects(
    departmentId: string,
  ): Promise<EmployeeWithDepartmentAndProjectsDto[]> {
    const employees = await this.employees.findByDepartmentWithProjects(departmentId);
    return employees.map((employee) => this.toEmployeeWithRelationsDto(employee));
  }

  async calculateBonus(id: string): Promise<number> {
    const employee = await this.employees.findById(id);
    if (!employee) {
      throw new EmployeeNotFoundError(id);
    }
    return this.bonusCalculator.calculateBonus(employee);
  }

  private toEmployeeDto(employee: Employee): EmployeeDto {
    return {
      id: employee.id,
      name: employee.name,
      currentPosition: employee.currentPosition,
      salary: employee.salary,
      departmentId: employee.departmentId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  private toEmployeeWithRelationsDto(
    employee: EmployeeWithRelations,
  ): EmployeeWithDepartmentAndProjectsDto {
    return {
      ...this.toEmployeeDto(employee),
      department: employee.department,
      projects: employee.projects,
    };
  }

  private toCreateData(data: CreateEmployeeDto): CreateEmployeeData {
    return {
      name: data.name,
      currentPosition: data.currentPosition,
      salary: data.salary,
      departmentId: data.departmentId ?? null,
    };
  }

  private toUpdateData(data: UpdateEmployeeDto): UpdateEmployeeData {
    return {
      name: data.name,
      currentPosition: data.currentPosition,
      salary: data.salary,
      departmentId: data.departmentId,
    };
  }
}

export class EmployeeNotFoundError extends Error {
  constructor(id: string) {
    super(`Empleado con id "${id}" no encontrado`);
    this.name = 'EmployeeNotFoundError';
  }
}
