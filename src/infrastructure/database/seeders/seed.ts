import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { env } from '../../config/env.js';

const BCRYPT_ROUNDS = 10;

const DEFAULT_ROLE_NAMES = ['User', 'Admin'];

export async function runSeed(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (const name of DEFAULT_ROLE_NAMES) {
      await queryRunner.query(
        `INSERT INTO roles (name, created_at, updated_at)
         VALUES ($1, now(), now())
         ON CONFLICT (name) DO NOTHING`,
        [name],
      );
    }

    const existing = await queryRunner.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [
      env.ADMIN_EMAIL,
    ]);

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_ROUNDS);

      await queryRunner.query(
        `INSERT INTO users (email, password_hash, created_at)
         VALUES ($1, $2, now())`,
        [env.ADMIN_EMAIL, passwordHash],
      );

      await queryRunner.query(
        `INSERT INTO user_roles ("usersId", "rolesId")
         SELECT u.id, r.id
         FROM users u
         JOIN roles r ON r.name = 'Admin'
         WHERE u.email = $1
         ON CONFLICT DO NOTHING`,
        [env.ADMIN_EMAIL],
      );
    }

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
