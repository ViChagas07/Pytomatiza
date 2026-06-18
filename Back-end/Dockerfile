FROM python:3.11-slim AS builder

RUN apt-get update \
    && apt-get install -y curl build-essential \
    && curl -sSL https://install.python-poetry.org | python3 -

ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

COPY pyproject.toml poetry.lock* ./
COPY src ./src

RUN touch README.md

# cria ambiente dentro do projeto
RUN poetry config virtualenvs.in-project true

RUN poetry install --only main --no-ansi


FROM python:3.11-slim

# ── System dependencies ─────────────────────────────────────────────
# poppler-utils: required by pdf2image (PDF → images)
# tesseract-ocr: OCR engine
# libgl1-mesa-glx + libglib2.0-0: required by OpenCV headless
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        poppler-utils \
        tesseract-ocr \
        tesseract-ocr-por \
        libgl1-mesa-glx \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 8000

CMD ["uvicorn","pytomatiza.main:app","--host","0.0.0.0","--port","8000"]