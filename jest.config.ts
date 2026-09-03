import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test/setup-env.ts'],
  testTimeout: 30_000,
  // Los tests de integración comparten la misma DB de test (truncate de tablas);
  // ejecutarse en paralelo entre archivos genera condiciones de carrera.
  maxWorkers: 1,
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};

export default config;
