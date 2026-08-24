# Guía de contribución

## Convención de commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/es/). Todos los commits deben seguir este formato:

```
<tipo>(<scope>): descripción breve en imperativo
```

### Tipos permitidos

| Tipo       | Uso                                                               |
| ---------- | ----------------------------------------------------------------- |
| `feat`     | Nueva funcionalidad para el usuario                               |
| `fix`      | Corrección de un bug                                              |
| `chore`    | Tareas de mantenimiento: tooling, dependencias, configuración, CI |
| `docs`     | Cambios solo en documentación                                     |
| `test`     | Añadir o corregir tests                                           |
| `refactor` | Cambio de código que ni añade features ni corrige bugs            |

### Reglas

- La descripción va en minúsculas, sin punto final y en tiempo imperativo (`add`, no `added`)
- El `scope` es opcional y debe indicar la zona afectada: `(entities)`, `(migrations)`, `(api)`, `(deps)`…
- Un commit, un propósito: no mezclar tipos en el mismo commit

### Ejemplos

```
feat(entities): add new user response entity with custom value support
fix(migrations): guard against duplicate index creation on rerun
chore(deps): bump fastify to 5.2.0
docs: document dependency rule between layers
test(use-cases): cover create employee validation errors
refactor(api): extract employee routes into dedicated module
```

## Flujo de trabajo

1. Crea una rama descriptiva desde `main` (`feat/employee-crud`, `fix/migration-index`)
2. Haz tus cambios en commits atómicos siguiendo la convención
3. Antes de push, verifica localmente:
   ```bash
   npm run lint
   npm run build
   ```
4. Abre un Pull Request hacia `main`

## Hooks automáticos

El repositorio tiene Husky + lint-staged configurados: cada commit ejecuta `eslint --fix` y `prettier --write` sobre los archivos staged. Si hay errores de lint que no se puedan auto-corregir, el commit se aborta.
