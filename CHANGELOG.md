# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

_No hay cambios pendientes de publicar._

## [1.0.0] - 2026-09-08

Primera versión estable. Recreación en Node.js/TypeScript de la API de gestión de empleados aplicando Clean Architecture.

### Añadido

- **Autenticación y autorización**: registro y login con JWT Bearer, roles `Admin`/`User` y hook `requireRole` para rutas protegidas
- **Empleados**: CRUD completo (`GET /api/employees`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id`), historial de posiciones y asignación/desasignación de proyectos, con cálculo de bonificación por tipo de posición
- **Departamentos**: CRUD y endpoint `GET /api/departments/:id/employees-with-projects` (QueryBuilder)
- **Proyectos**: CRUD completo
- **Cálculo de bonificaciones** por tipo de posición (patrón Strategy + Factory con inyección de dependencias)
- **Clean Architecture**: `domain` / `application` / `infrastructure` / `api` con inyección de dependencias (tsyringe) y regla de dependencias hacia el dominio
- **Infraestructura**: Fastify + TypeORM + PostgreSQL con migraciones versionadas (`synchronize: false`), pool de conexiones explícito e índices en claves foráneas
- **API documentada**: Swagger UI en `/docs` con esquema `bearerAuth` en rutas protegidas y colección de Postman
- **Observabilidad**: logging estructurado con Pino, manejo global de errores con `correlationId`, cabeceras de seguridad (Helmet), CORS con whitelist y rate limit en login
- **Testing**: 330 tests (jest + Supertest) con cobertura mínima del 80% y base de datos de test aislada
- **CI/CD**: GitHub Actions con `npm ci` + lint + build, PostgreSQL como servicio y migraciones en el workflow de CI; build de la imagen Docker de producción

### Correcciones

- Sincronizado `package-lock.json` con npm 10 para que `npm ci` funcione en el Dockerfile multi-stage

### Limpieza de deuda técnica

- **Eliminados barrels sin consumidores**: `src/application/services/index.ts` y `src/application/repositories/index.ts` no eran importados por ninguna parte del código (los servicios y repositorios se importan directamente por archivo). Son recuperables desde el historial de git.
- **Eliminado `employeeWithPositionHistoryDtoSchema`**: schema de Zod sin uso; el tipo `EmployeeWithPositionHistoryDto` ahora se deriva directo de `EmployeeDto` + `PositionHistoryDto`, sin una constante de runtime muerta.
- **Eliminado `TypeOrmMigraineRepository`**: implementación ORM del puerto `MigraineRepository` sin consumidores ni pruebas (el caso de uso `FindReportUc` inyecta el puerto con un mock). El puerto de dominio, el caso de uso y su prueba se conservan.
- **Declarada dependencia directa `ajv@^8.20.0`**: el código la importa (`src/api/schemas/json-schema.ts`) pero solo llegaba de forma transitiva vía Fastify; ahora está declarada en `package.json` con su entrada sincronizada en el lock file.
- **Movido `pino-pretty` a `devDependencies`**: solo se usa en desarrollo como transporte de logs; la imagen de producción (`npm ci --omit=dev`) ya no lo incluye.

### Verificaciones

- `npm run lint`, `tsc --noUnusedLocals --noUnusedParameters` y `npm test` (26 suites / 330 tests) pasan sin cambios tras la limpieza.
