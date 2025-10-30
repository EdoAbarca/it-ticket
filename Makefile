include .env
export $(shell sed 's/=.*//' .env)

.PHONY: help up down logs backend-shell frontend-shell db-shell restart clean build test health backup restore

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services (build and run in background)
	docker compose up -d --build

down: ## Stop all services
	docker compose down

logs: ## View logs (follow mode)
	docker compose logs -f

logs-backend: ## View backend logs only
	docker compose logs -f backend

logs-frontend: ## View frontend logs only
	docker compose logs -f frontend

logs-db: ## View database logs only
	docker compose logs -f postgres

backend-shell: ## Access backend container shell
	docker compose exec backend sh

frontend-shell: ## Access frontend container shell
	docker compose exec frontend sh

db-shell: ## Access database shell
	docker compose exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

restart: ## Restart all services (rebuild)
	docker compose down && docker compose up -d --build

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi all

build: ## Build all images without starting services
	docker compose build

test: ## Run backend tests in container
	docker compose exec backend npm test

health: ## Check health status of all services
	@docker compose ps
	@echo "\nHealth checks:"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' $$(docker compose ps -q) 2>/dev/null || echo "No health checks configured"

backup: ## Backup database to backup.sql
	docker exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up to backup_$$(date +%Y%m%d_%H%M%S).sql"

restore: ## Restore database from backup.sql (use: make restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backup.sql"; exit 1; fi
	docker exec -i postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB} < $(FILE)
	@echo "Database restored from $(FILE)"

dev: ## Start in development mode with hot reload
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

prod: ## Start in production mode
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

ps: ## Show running containers
	docker compose ps

stats: ## Show container resource usage
	docker stats $$(docker compose ps -q)

prune: ## Remove unused Docker resources
	docker system prune -f

migrate: ## Run database migrations
	docker compose exec backend npx prisma migrate deploy

seed: ## Seed the database
	docker compose exec backend npx prisma db seed
