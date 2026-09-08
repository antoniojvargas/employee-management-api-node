import { AuthService } from '../../application/services/auth.service.js';
import { DepartmentService } from '../../application/services/department.service.js';
import { EmployeeService } from '../../application/services/employee.service.js';
import { ProjectService } from '../../application/services/project.service.js';
import { JwtTokenService } from '../auth/jwt-token.service.js';
import { AppDataSource } from '../database/data-source.js';
import { DepartmentEntity } from '../database/entities/department.orm-entity.js';
import { EmployeeEntity } from '../database/entities/employee.orm-entity.js';
import { ProjectEntity } from '../database/entities/project.orm-entity.js';
import { RoleEntity } from '../database/entities/role.orm-entity.js';
import { UserEntity } from '../database/entities/user.orm-entity.js';
import { TypeOrmDepartmentRepository } from '../database/repositories/department.repository.js';
import { TypeOrmEmployeeRepository } from '../database/repositories/employee.repository.js';
import { TypeOrmProjectRepository } from '../database/repositories/project.repository.js';
import { TypeOrmUserRepository } from '../database/repositories/user.repository.js';
import { resolveBonusCalculator } from './container.js';

// Composition root: única zona donde se construye el grafo de dependencias
// de la aplicación. Las rutas Fastify consumen estos getters y no conocen
// los repositorios concretos, AppDataSource ni los detalles de infraestructura.

export function getAuthService(): AuthService {
  const users = new TypeOrmUserRepository(
    AppDataSource.getRepository(UserEntity),
    AppDataSource.getRepository(RoleEntity),
  );
  return new AuthService(users, new JwtTokenService());
}

export function getDepartmentService(): DepartmentService {
  const departments = new TypeOrmDepartmentRepository(
    AppDataSource.getRepository(DepartmentEntity),
  );
  return new DepartmentService(departments);
}

export function getEmployeeService(): EmployeeService {
  const employees = new TypeOrmEmployeeRepository(AppDataSource.getRepository(EmployeeEntity));
  return new EmployeeService(employees, resolveBonusCalculator());
}

export function getProjectService(): ProjectService {
  const projects = new TypeOrmProjectRepository(AppDataSource.getRepository(ProjectEntity));
  return new ProjectService(projects);
}
