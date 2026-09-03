import { InjectionToken } from 'tsyringe';
import type { IDepartmentRepository } from './department-repository.interface.js';

export const DepartmentRepositoryToken: InjectionToken<IDepartmentRepository> =
  Symbol('DepartmentRepository');
