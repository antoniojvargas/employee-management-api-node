import type { CreateProjectDto, ProjectDto, UpdateProjectDto } from '../dtos/project.dto.js';

export interface IProjectService {
  getById(id: string): Promise<ProjectDto | null>;
  getAll(): Promise<ProjectDto[]>;
  create(data: CreateProjectDto): Promise<ProjectDto>;
  update(id: string, data: UpdateProjectDto): Promise<ProjectDto | null>;
  delete(id: string): Promise<boolean>;
}
