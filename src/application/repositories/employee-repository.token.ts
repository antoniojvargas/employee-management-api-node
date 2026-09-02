import { InjectionToken } from 'tsyringe';
import type { IEmployeeRepository } from './employee-repository.interface.js';

export const EmployeeRepositoryToken: InjectionToken<IEmployeeRepository> =
  Symbol('EmployeeRepository');
