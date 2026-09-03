import type { DeleteResult, Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.orm-entity.js';
import type { Project } from '../../../domain/entities/project.js';
import type {
  CreateProjectData,
  IProjectRepository,
  UpdateProjectData,
} from '../../../application/repositories/project-repository.interface.js';

export class TypeOrmProjectRepository implements IProjectRepository {
  constructor(private readonly projects: Repository<ProjectEntity>) {}

  async findById(id: string): Promise<Project | null> {
    const entity = await this.projects.findOne({ where: { id } });
    return entity ? this.toProject(entity) : null;
  }

  async findAll(): Promise<Project[]> {
    const entities = await this.projects.find();
    return entities.map((entity) => this.toProject(entity));
  }

  async create(data: CreateProjectData): Promise<Project> {
    const entity = this.projects.create(data);
    const saved = await this.projects.save(entity);
    return this.toProject(saved);
  }

  async update(id: string, data: UpdateProjectData): Promise<Project | null> {
    const result = await this.projects.update({ id }, data);
    if (!result.affected) return null;

    const entity = await this.projects.findOne({ where: { id } });
    return entity ? this.toProject(entity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result: DeleteResult = await this.projects.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toProject(entity: ProjectEntity): Project {
    return {
      id: entity.id,
      name: entity.name,
      startDate: entity.startDate,
      endDate: entity.endDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
