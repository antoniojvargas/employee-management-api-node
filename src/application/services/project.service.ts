import { inject, injectable } from 'tsyringe';
import type { Project } from '../../domain/entities/project.js';
import type {
  CreateProjectData,
  IProjectRepository,
  UpdateProjectData,
} from '../repositories/project-repository.interface.js';
import type { CreateProjectDto, ProjectDto, UpdateProjectDto } from '../dtos/project.dto.js';
import type { IProjectService } from './project-service.interface.js';
import { ProjectRepositoryToken } from '../repositories/project-repository.token.js';

@injectable()
export class ProjectService implements IProjectService {
  constructor(@inject(ProjectRepositoryToken) private readonly projects: IProjectRepository) {}

  async getById(id: string): Promise<ProjectDto | null> {
    const project = await this.projects.findById(id);
    return project ? this.toProjectDto(project) : null;
  }

  async getAll(): Promise<ProjectDto[]> {
    const projects = await this.projects.findAll();
    return projects.map((project) => this.toProjectDto(project));
  }

  async create(data: CreateProjectDto): Promise<ProjectDto> {
    const project = await this.projects.create(this.toCreateData(data));
    return this.toProjectDto(project);
  }

  async update(id: string, data: UpdateProjectDto): Promise<ProjectDto | null> {
    const project = await this.projects.update(id, this.toUpdateData(data));
    return project ? this.toProjectDto(project) : null;
  }

  async delete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  private toProjectDto(project: Project): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toCreateData(data: CreateProjectDto): CreateProjectData {
    return {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }

  private toUpdateData(data: UpdateProjectDto): UpdateProjectData {
    return {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }
}
