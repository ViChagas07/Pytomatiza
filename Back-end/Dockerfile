# ─── Build stage ───────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_HOME="/opt/poetry" \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true

ENV PATH="$POETRY_HOME/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl build-essential \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && apt-get purge -y --auto-remove build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml poetry.lock* ./

# Placeholder README so poetry does not complain about missing readme file
RUN touch README.md

RUN poetry install --only main --no-ansi

# ─── Runtime stage ─────────────────────────────────────────────────────────
FROM python:3.11-slim 

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r pytomatiza && useradd -r -g pytomatiza pytomatiza

WORKDIR /app

# Copy virtualenv from builder (owned by root, readable by all)
COPY --from=builder /app/.venv .venv

# Copy application source with proper ownership (avoids chown I/O errors on Windows)
COPY --chown=pytomatiza:pytomatiza . .

USER pytomatiza

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "pytomatiza.main:app", "--host", "0.0.0.0", "--port", "8000"]
