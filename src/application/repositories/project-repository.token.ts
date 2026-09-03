import { InjectionToken } from 'tsyringe';
import type { IProjectRepository } from './project-repository.interface.js';

export const ProjectRepositoryToken: InjectionToken<IProjectRepository> =
  Symbol('ProjectRepository');
