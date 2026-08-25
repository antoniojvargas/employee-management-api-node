import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup20260825000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Verificación de conexión a PostgreSQL — sin cambios schema
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
