import { inject, injectable } from 'tsyringe';
import type { Employee } from '../../domain/entities/employee.js';
import type { PositionHistory } from '../../domain/entities/position-history.js';
import type {
  EmployeeWithPositionHistory,
  EmployeeWithRelations,
} from '../repositories/employee-repository.interface.js';
import type {
  IEmployeeRepository,
  CreateEmployeeData,
  AssignToProjectResult,
  UpdateEmployeeData,
} from '../repositories/employee-repository.interface.js';
import type { IBonusCalculator } from '../bonuses/bonus-calculator.interface.js';
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
import type {
  AssignProjectServiceResult,
  IEmployeeService,
  UnassignProjectServiceResult,
} from './employee-service.interface.js';
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

  async getByIdWithPositionHistory(id: string): Promise<EmployeeWithPositionHistoryDto | null> {
    const employee = await this.employees.findByIdWithPositionHistory(id);
    return employee ? this.toEmployeeWithPositionHistoryDto(employee) : null;
  }

  async createPositionHistory(
    employeeId: string,
    data: CreatePositionHistoryDto,
  ): Promise<PositionHistoryDto | null> {
    const history = await this.employees.createPositionHistory(employeeId, {
      position: data.position,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    return history ? this.toPositionHistoryDto(history) : null;
  }

  async assignToProject(
    employeeId: string,
    projectId: string,
  ): Promise<AssignProjectServiceResult> {
    const result = await this.employees.assignToProject(employeeId, projectId);
    return this.toAssignProjectServiceResult(result);
  }

  async unassignFromProject(
    employeeId: string,
    projectId: string,
  ): Promise<UnassignProjectServiceResult> {
    const result = await this.employees.unassignFromProject(employeeId, projectId);
    switch (result.status) {
      case 'employee-not-found':
        return { status: 'employee-not-found' };
      case 'project-not-found':
        return { status: 'project-not-found' };
      case 'removed':
        return { status: 'removed' };
    }
  }

  async getAll(): Promise<EmployeeDto[]> {
    const employees = await this.employees.findAll();
    return employees.map((employee) => this.toEmployeeDto(employee));
  }

  async getAllWithBonus(): Promise<EmployeeWithBonusDto[]> {
    const employees = await this.employees.findAll();
    return employees.map((employee) => ({
      ...this.toEmployeeDto(employee),
      bonus: this.bonusCalculator.calculateBonus(employee),
    }));
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

  private toEmployeeWithPositionHistoryDto(
    employee: EmployeeWithPositionHistory,
  ): EmployeeWithPositionHistoryDto {
    return {
      ...this.toEmployeeDto(employee),
      positionHistory: employee.positionHistory,
    };
  }

  private toPositionHistoryDto(history: PositionHistory): PositionHistoryDto {
    return {
      id: history.id,
      employeeId: history.employeeId,
      position: history.position,
      startDate: history.startDate,
      endDate: history.endDate,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    };
  }

  private toAssignProjectServiceResult(result: AssignToProjectResult): AssignProjectServiceResult {
    switch (result.status) {
      case 'employee-not-found':
        return { status: 'employee-not-found' };
      case 'project-not-found':
        return { status: 'project-not-found' };
      case 'assigned':
        return { status: 'assigned', employee: this.toEmployeeWithRelationsDto(result.employee) };
    }
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
