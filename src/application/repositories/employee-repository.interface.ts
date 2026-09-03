import type { Department } from '../../domain/entities/department.js';
import type { Employee } from '../../domain/entities/employee.js';
import type { PositionHistory } from '../../domain/entities/position-history.js';
import type { Project } from '../../domain/entities/project.js';

export interface EmployeeWithRelations extends Employee {
  department: Department | null;
  projects: Project[];
}

export interface EmployeeWithPositionHistory extends Employee {
  positionHistory: PositionHistory[];
}

export interface CreateEmployeeData {
  name: string;
  currentPosition: string;
  salary: number;
  departmentId: string | null;
}

export interface UpdateEmployeeData {
  name?: string;
  currentPosition?: string;
  salary?: number;
  departmentId?: string | null;
}

export interface CreatePositionHistoryData {
  position: string;
  startDate: Date;
  endDate: Date;
}

export type AssignToProjectResult =
  | { status: 'employee-not-found' }
  | { status: 'project-not-found' }
  | { status: 'assigned'; employee: EmployeeWithRelations };

export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByIdWithPositionHistory(id: string): Promise<EmployeeWithPositionHistory | null>;
  findAll(): Promise<Employee[]>;
  create(data: CreateEmployeeData): Promise<Employee>;
  update(id: string, data: UpdateEmployeeData): Promise<Employee | null>;
  delete(id: string): Promise<boolean>;
  findByDepartmentWithProjects(departmentId: string): Promise<EmployeeWithRelations[]>;
  createPositionHistory(
    employeeId: string,
    data: CreatePositionHistoryData,
  ): Promise<PositionHistory | null>;
  assignToProject(employeeId: string, projectId: string): Promise<AssignToProjectResult>;
}
