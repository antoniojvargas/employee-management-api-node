import { AppDataSource } from '../../infrastructure/database/data-source.js';

const ALL_TABLES = [
  'employee_projects',
  'position_history',
  'projects',
  'employees',
  'departments',
  'new_user_responses',
  'new_translations',
  'new_selections',
  'new_questions',
  'user_roles',
  'users',
  'roles',
];

export async function resetTestDatabase(): Promise<void> {
  const tables = ALL_TABLES.map((table) => `"${table}"`).join(', ');
  await AppDataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
