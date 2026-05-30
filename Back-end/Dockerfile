FROM python:3.11-slim AS builder

RUN apt-get update \
    && apt-get install -y curl build-essential \
    && curl -sSL https://install.python-poetry.org | python3 -

ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

COPY pyproject.toml poetry.lock* ./

# copia o código ANTES do poetry install
COPY src ./src

RUN touch README.md

RUN poetry install --only main --no-ansi


FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8000

CMD ["poetry","run","uvicorn","pytomatiza.main:app","--host","0.0.0.0","--port","8000"]