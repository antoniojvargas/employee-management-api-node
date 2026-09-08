# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Limpieza de deuda técnica

- **Eliminados barrels sin consumidores**: `src/application/services/index.ts` y `src/application/repositories/index.ts` no eran importados por ninguna parte del código (los servicios y repositorios se importan directamente por archivo). Son recuperables desde el historial de git.
- **Eliminado `employeeWithPositionHistoryDtoSchema`**: schema de Zod sin uso; el tipo `EmployeeWithPositionHistoryDto` ahora se deriva directo de `EmployeeDto` + `PositionHistoryDto`, sin una constante de runtime muerta.
- **Eliminado `TypeOrmMigraineRepository`**: implementación ORM del puerto `MigraineRepository` sin consumidores ni pruebas (el caso de uso `FindReportUc` inyecta el puerto con un mock). El puerto de dominio, el caso de uso y su prueba se conservan.
- **Declarada dependencia directa `ajv@^8.20.0`**: el código la importa (`src/api/schemas/json-schema.ts`) pero solo llegaba de forma transitiva vía Fastify; ahora está declarada en `package.json` con su entrada sincronizada en el lock file.
- **Movido `pino-pretty` a `devDependencies`**: solo se usa en desarrollo como transporte de logs; la imagen de producción (`npm ci --omit=dev`) ya no lo incluye.

### Verificaciones

- `npm run lint`, `tsc --noUnusedLocals --noUnusedParameters` y `npm test` (26 suites / 330 tests) pasan sin cambios tras la limpieza.
