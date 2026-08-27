import type { User } from '../entities/user.entity.js';
import type { Role } from '../entities/role.entity.js';

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  roles: Role[];
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithRoles | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: CreateUserData): Promise<UserWithRoles>;
}
