.PHONY: setup services-up services-down services-clean db-up db-seed db-reset sqlc dev-api dev-web dev clean run valhalla-clean

DB_URL="postgres://resq:resq@localhost:5432/resq_dev?sslmode=disable"

setup:
	cd frontend && bun install
	cd backend && go mod download
	go install github.com/pressly/goose/v3/cmd/goose@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

services-up:
	docker compose up -d postgres redis valhalla

services-down:
	docker compose stop

services-clean:
	docker compose down -v
	docker system prune -f

db-up:
	cd backend && goose -dir sql/migrations postgres $(DB_URL) up

db-seed:
	cd scripts && bun install && bun run seed.ts

db-reset:
	cd backend && goose -dir sql/migrations postgres $(DB_URL) reset

sqlc:
	cd backend && sqlc generate

dev-api:
	cd backend && go run ./cmd/resq-server

dev-web:
	cd frontend && bun run dev

dev:
	make -j2 dev-api dev-web

run:
	docker compose up --build -d

clean:
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf backend/tmp

valhalla-clean:
	rm -rf valhalla_data/valhalla_tiles
	rm -f valhalla_data/valhalla.json

