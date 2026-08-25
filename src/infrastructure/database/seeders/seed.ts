import { DataSource } from 'typeorm';

export async function runSeed(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // TODO: insertar datos iniciales aquí
    // Ejemplo:
    // await queryRunner.query(`INSERT INTO ...`);

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
