import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import {
  DepartmentEntity,
  EmployeeEntity,
  NewQuestionEntity,
  NewSelectionEntity,
  NewTranslationEntity,
  NewUserResponseEntity,
  PositionHistoryEntity,
  ProjectEntity,
  RoleEntity,
  UserEntity,
} from './entities/index.js';
import { CreateNewQuestionsSystem20260824000000 } from './migrations/20260824000000-create-new-questions-system.js';
import { InitialSetup20260825000000 } from './migrations/20260825000000-initial-setup.js';
import { CreateDomainEntities20260826000000 } from './migrations/20260826000000-create-domain-entities.js';
import { CreateUsersRoles20260827000000 } from './migrations/20260827000000-create-users-roles.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['query', 'error'] : false,
  extra: {
    // Pool de conexiones pg — valores explícitos en lugar de defaults
    max: 10, // máximo de conexiones simultáneas; suficiente para API monolítica con tráfico moderado
    idleTimeoutMillis: 30_000, // cierra conexiones inactivas tras 30s para liberar recursos en el DB server
    connectionTimeoutMillis: 5_000, // falla rápido (5s) si la DB no responde en vez de colgar la request
  },
  entities: [
    DepartmentEntity,
    EmployeeEntity,
    NewQuestionEntity,
    NewSelectionEntity,
    NewTranslationEntity,
    NewUserResponseEntity,
    PositionHistoryEntity,
    ProjectEntity,
    RoleEntity,
    UserEntity,
  ],
  migrations: [
    InitialSetup20260825000000,
    CreateNewQuestionsSystem20260824000000,
    CreateDomainEntities20260826000000,
    CreateUsersRoles20260827000000,
  ],
});
