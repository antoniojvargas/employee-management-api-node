import type { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.orm-entity.js';
import { RoleEntity } from '../entities/role.orm-entity.js';
import type {
  CreateUserData,
  UserRepository,
  UserWithRoles,
} from '../../../domain/ports/user-repository.js';
import type { Role } from '../../../domain/entities/role.entity.js';

export class TypeOrmUserRepository implements UserRepository {
  constructor(
    private readonly users: Repository<UserEntity>,
    private readonly roles: Repository<RoleEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    const user = await this.users.findOne({
      where: { email },
      relations: { roles: true },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.roles.findOne({ where: { name } });
    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async create(data: CreateUserData): Promise<UserWithRoles> {
    const roleEntities = data.roles.map((r) => this.roles.create({ id: r.id, name: r.name }));
    const entity = this.users.create({
      email: data.email,
      passwordHash: data.passwordHash,
      roles: roleEntities,
    });
    const saved = await this.users.save(entity);

    return {
      id: saved.id,
      email: saved.email,
      passwordHash: saved.passwordHash,
      createdAt: saved.createdAt,
      roles: data.roles,
    };
  }
}
