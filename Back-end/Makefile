# Pytomatiza+ Backend Makefile / Script Reference
# These commands are runnable via npm/pnpm scripts or directly in Docker.

.PHONY: help install dev run build up down migrate-create migrate-up migrate-down test lint format

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Development ─────────────────────────────────────────────────────────

install: ## Install Python dependencies with Poetry
	poetry install

dev: ## Run development server with hot reload
	poetry run uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000

run: ## Run production server
	poetry run uvicorn pytomatiza.main:app --host 0.0.0.0 --port 8000

# ── Docker ──────────────────────────────────────────────────────────────

build: ## Build Docker image
	docker compose build

up: ## Start all services (api, postgres, redis, prometheus, grafana)
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f

# ── Database Migrations ─────────────────────────────────────────────────

migrate-create: ## Create a new auto-generated migration (usage: make migrate-create msg="add column")
	poetry run alembic revision --autogenerate -m "$(msg)"

migrate-up: ## Apply all pending migrations
	poetry run alembic upgrade head

migrate-down: ## Rollback the last migration
	poetry run alembic downgrade -1

migrate-history: ## Show migration history
	poetry run alembic history --verbose

# ── Testing ─────────────────────────────────────────────────────────────

test: ## Run all tests
	poetry run pytest

test-unit: ## Run unit tests only
	poetry run pytest tests/unit

test-integration: ## Run integration tests only
	poetry run pytest tests/integration

test-cov: ## Run tests with coverage report
	poetry run pytest --cov=pytomatiza --cov-report=term-missing --cov-report=html

# ── Code Quality ────────────────────────────────────────────────────────

lint: ## Run ruff linter
	poetry run ruff check src/

format: ## Run ruff formatter
	poetry run ruff format src/

typecheck: ## Run mypy type checker
	poetry run mypy src/
