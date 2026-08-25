# employee-management-api-node

[![Build](https://img.shields.io/badge/build-unknown-lightgrey)](#)
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)](#)

Recreación en **Node.js/TypeScript** de una API de gestión de empleados.

## Objetivo

Construir una API para la administración de empleados aplicando los principios de **Clean Architecture**: separación clara entre dominio, aplicación e infraestructura, con independencia de frameworks y detalles de persistencia.

## Stack

- **Runtime:** Node.js + TypeScript
- **HTTP:** Fastify
- **ORM:** TypeORM
- **Base de datos:** PostgreSQL
- **Arquitectura:** Clean Architecture (domain / application / infrastructure)
- **Testing:** Jest + Supertest

## Configuración

Las variables de entorno del proyecto están documentadas en `.env.example`. Para trabajar en local, cópialo a `.env` y ajusta los valores:

```bash
cp .env.example .env
```

| Variable         | Descripción                                        |
| ---------------- | -------------------------------------------------- |
| `NODE_ENV`       | Entorno de ejecución (`development`, `production`) |
| `PORT`           | Puerto HTTP de la API                              |
| `DB_HOST`        | Host de PostgreSQL                                 |
| `DB_PORT`        | Puerto de PostgreSQL                               |
| `DB_USER`        | Usuario de la base de datos                        |
| `DB_PASSWORD`    | Contraseña de la base de datos                     |
| `DB_NAME`        | Nombre de la base de datos                         |
| `JWT_SECRET`     | Secreto para firmar los tokens JWT                 |
| `JWT_EXPIRES_IN` | Expiración de los tokens JWT (ej. `1d`, `12h`)     |

El archivo `.env` está ignorado por git: nunca lo commitees con valores reales.

## Arranque con Docker

Levanta la API y PostgreSQL con un solo comando:

```bash
docker compose up --build
```

### Servicios y puertos

| Servicio | Puerto expuesto | Descripción            |
| -------- | --------------- | ---------------------- |
| `api`    | `8080`          | API Fastify (HTTP)     |
| `db`     | `5432`          | PostgreSQL 16 (Alpine) |

### Credenciales de la base de datos (seed)

| Campo    | Valor                 |
| -------- | --------------------- |
| Host     | `localhost`           |
| Puerto   | `5432`                |
| Usuario  | `employee`            |
| Password | `employee`            |
| DB       | `employee_management` |

### Atajos con Make

```bash
make up        # docker compose up -d --build
make down      # docker compose down
make logs      # docker compose logs -f api
make test      # npm test
make migrate   # npm run migration:run
```

### Hot-reload en desarrollo

En desarrollo se aplica automáticamente `docker-compose.override.yml`, que monta `src/` como volumen y ejecuta `tsx watch` para hot-reload.

## Migraciones de base de datos

TypeORM opera en modo **migraciones explícitas** (`synchronize: false`). Esto significa que el esquema de la base de datos **nunca se modifica automáticamente** — cada cambio debe ser generado como una migración y aplicado de forma controlada.

### ¿Por qué `synchronize: false`?

- `synchronize: true` altera tablas automáticamente al reiniciar la app, lo cual puede causar **pérdida de datos** en producción
- Las migraciones dan **control total**: cada cambio es un archivo versionado, auditable y revirtible
- Permite aplicar cambios de schema **antes o después** del deploy, no solo al iniciar la app

### Flujo de trabajo

**1. Modificar una entidad** (ej. agregar una columna en `src/infrastructure/database/entities/`)

**2. Generar la migración** comparando el estado de las entidades contra la DB:

```bash
npm run build
npm run migration:generate -- src/infrastructure/database/migrations/20260825-add-description-to-questions
```

TypeORM compara las entidades compiladas contra el esquema actual y genera el archivo de migración con los `UP` y `DOWN` necesarios.

**3. Revisar el archivo generado** en `src/infrastructure/database/migrations/`

**4. Aplicar la migración:**

```bash
npm run migration:run
```

**5. Revertir si es necesario:**

```bash
npm run migration:revert
```

**6. Verificar estado de migraciones:**

```bash
npm run migration:show
```

### Scripts disponibles

| Script                                 | Descripción                              |
| -------------------------------------- | ---------------------------------------- |
| `npm run migration:generate -- <path>` | Genera migración desde diff de entidades |
| `npm run migration:run`                | Aplica migraciones pendientes            |
| `npm run migration:revert`             | Revierte la última migración aplicada    |
| `npm run migration:show`               | Lista migraciones y su estado            |

### Archivos de migración

```
src/infrastructure/database/migrations/
├── 20260825000000-initial-setup.ts
└── 20260824000000-create-new-questions-system.ts
```

Cada archivo exporta una clase con `up()` (aplicar) y `down()` (revertir). Las migraciones se ejecutan en orden cronológico.

## Arquitectura

Estructura basada en Clean Architecture:

```
src/
├── api/              # Controllers y rutas Fastify, middleware, composition root
├── application/      # Interfaces (puertos), DTOs, servicios/casos de uso, patrones
├── domain/           # Entidades y enums — sin dependencias externas
└── infrastructure/   # TypeORM, repositorios, JWT
    └── database/
        ├── entities/
        └── migrations/
```

### Regla de dependencias

Las dependencias apuntan siempre hacia adentro, hacia el dominio:

```
api → infrastructure → application → domain
```

- **domain** no depende de ninguna otra capa ni del framework
- **application** solo puede importar de `domain`
- **infrastructure** implementa los puertos definidos en `application` y `domain`
- **api** orquesta el flujo e inyecta las dependencias

```mermaid
flowchart LR
    client(["HTTP Client"]) --> api

    subgraph layers["Clean Architecture"]
        direction TB
        api["api<br/>controllers/rutas · middleware · composition root"]
        infra["infrastructure<br/>TypeORM · repositorios · JWT"]
        app["application<br/>interfaces · DTOs · servicios"]
        domain["domain<br/>entidades · enums — sin dependencias externas"]

        api -- depende de --> infra
        infra -- depende de --> app
        app -- depende de --> domain
    end

    infra --> db[("PostgreSQL")]

    style domain fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    style layers fill:#fafafa,stroke:#bdbdbd
```

### Equivalencias con la versión .NET original

| Original (.NET)                     | Este proyecto (Node.js)                  |
| ----------------------------------- | ---------------------------------------- |
| `EmployeeManagement.Domain`         | `src/domain/`                            |
| `EmployeeManagement.Application`    | `src/application/`                       |
| `EmployeeManagement.Infrastructure` | `src/infrastructure/`                    |
| `EmployeeManagement.Api`            | `src/api/`                               |
| EF Core                             | TypeORM                                  |
| Controllers de ASP.NET Core         | Rutas y handlers de Fastify              |
| ASP.NET Identity + JWT              | Autenticación JWT                        |
| xUnit + Moq (`tests/`)              | Jest + Supertest (`tests/`, planificado) |

## Estado del proyecto

🚧 En construcción — fase inicial de diseño de dominio y persistencia.
