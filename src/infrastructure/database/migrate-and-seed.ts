import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source.js';
import { runSeed } from './seeders/seed.js';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3_000;

async function waitForDb(dataSource: DataSource): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await dataSource.query('SELECT 1');
      return;
    } catch {
      console.log(
        `Intento ${attempt}/${MAX_RETRIES} — DB no disponible, reintentando en ${RETRY_DELAY_MS / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error(`No se pudo conectar a la DB después de ${MAX_RETRIES} intentos`);
}

export async function migrateAndSeed(): Promise<DataSource> {
  console.log('Inicializando conexión a la base de datos...');
  await AppDataSource.initialize();

  console.log('Verificando conectividad...');
  await waitForDb(AppDataSource);

  console.log('Ejecutando migraciones...');
  await AppDataSource.runMigrations();
  console.log('Migraciones completadas');

  console.log('Ejecutando seed...');
  await runSeed(AppDataSource);
  console.log('Seed completado');

  return AppDataSource;
}
