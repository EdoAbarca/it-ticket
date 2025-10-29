include .env
export $(shell sed 's/=.*//' .env)

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

backend-shell:
	docker compose exec backend sh

frontend-shell:
	docker compose exec frontend sh

db-shell:
	docker compose exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

restart:
	docker compose down && docker compose up -d --build
