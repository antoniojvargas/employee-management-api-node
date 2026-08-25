import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';

async function seed(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // TODO: insertar datos iniciales aquí
      // Ejemplo:
      // await queryRunner.query(`INSERT INTO ...`);

      await queryRunner.commitTransaction();
      console.log('Seed ejecutado correctamente');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Error durante el seed — transacción revertida', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (err) {
    console.error('Error al conectar con la base de datos', err);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
