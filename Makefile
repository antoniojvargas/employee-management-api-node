.DEFAULT_GOAL := help

.PHONY: help up down logs test migrate

help: ## Muestra los atajos disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36mmake %-10s\033[0m %s\n", $$1, $$2}'

up: ## Levanta el entorno de desarrollo completo (api + db)
	docker compose up -d --build

down: ## Detiene y elimina los contenedores del entorno
	docker compose down

logs: ## Muestra y sigue los logs del servicio api
	docker compose logs -f api

test: ## Ejecuta la suite de tests
	npm test

migrate: ## Ejecuta las migraciones pendientes de TypeORM
	npm run migration:run
