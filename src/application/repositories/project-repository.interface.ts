import type { Project } from '../../domain/entities/project.js';

export interface CreateProjectData {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateProjectData {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  create(data: CreateProjectData): Promise<Project>;
  update(id: string, data: UpdateProjectData): Promise<Project | null>;
  delete(id: string): Promise<boolean>;
}
