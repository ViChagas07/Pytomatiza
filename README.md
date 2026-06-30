<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="Front-end/public/Pytomatiza_Logo_Supremo.png">
    <img alt="Pytomatiza+ Logo" src="Front-end/public/Pytomatiza_Logo_Supremo.png" width="120">
  </picture>
</p>

<h1 align="center">Pytomatiza<span style="color:#e11d48">+</span></h1>

<p align="center">
  <strong>Intelligent Automation Platform — AI-Powered Workflow Orchestration</strong>
</p>

<p align="center">
  <a href="#-architecture"><img src="https://img.shields.io/badge/architecture-clean--architecture-blue?style=flat-square" alt="Clean Architecture"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/frontend-Next.js_16-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/python-3.11-blue?style=flat-square&logo=python&logoColor=white" alt="Python 3.11"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/typescript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/license-proprietary-red?style=flat-square" alt="License"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/i18n-11_languages-8B5CF6?style=flat-square" alt="11 Languages"></a>
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-api-overview">API</a> ·
  <a href="#-deployment">Deployment</a> ·
  <a href="#-contributing">Contributing</a>
</p>

<br>

---

## 📖 Overview

**Pytomatiza+** is a full-stack intelligent automation platform that orchestrates AI agents, processes documents via OCR, transforms media, integrates with third-party services, and delivers a multilingual user experience — all backed by a rigorously tested, observable infrastructure.

Users define automation workflows in **natural language** (Portuguese or English). The platform's AI engine — powered by a multi-provider LLM abstraction layer (Gemini, Ollama, OpenAI) — interprets intent, generates structured execution steps, and runs them against a growing library of integrations: email, WhatsApp, Slack, Discord, Telegram, Trello, Jira, Zoom, Facebook, Google Drive, Google Sheets, and more.

Every execution is recorded as an `AutomationRun` with full input/output tracking, error capture, and Prometheus metrics — enabling auditability and continuous improvement.

---

## ✨ Features

### 🤖 Multi-Agent AI Orchestration
- **5 specialized agent types**: Productivity, Data, Content, Admin, Technical — each with its own toolset and keyword recognition
- **Natural language → structured workflow** translation via Gemini / Ollama / OpenAI
- **Capability-aware agent routing**: agents refuse out-of-scope requests and recommend the correct agent type
- **Agent lifecycle management**: activate, deactivate, pause, resume — with full audit trail

### 📄 Document OCR Processing
- **Multi-provider OCR**: Tesseract (local), EasyOCR, Google Vision, Azure, AWS Textract — swappable via Strategy pattern
- **Pre-processing pipeline**: grayscale conversion, contrast enhancement, denoising (OpenCV)
- **Intelligent field extraction**: CPF, CNPJ, emails, phones, dates, monetary values, URLs, license plates — regex-based with compiled patterns
- **PDF support**: rasterization via `pdf2image` + per-page OCR with configurable page limits
- **Prometheus metrics**: requests, failures, processing time, pages processed, provider usage

### 🎨 Media Transformation
- **Image processing**: resize (Lanczos), compress, grayscale, blur (Gaussian), sharpen
- **Format conversion**: PNG ↔ JPEG ↔ WEBP
- **Streaming response**: processed images returned directly via `StreamingResponse`

### 📊 Data Analysis
- **Natural language data analysis** backed by LLM
- **Python/pandas code generation** for programmatic data tasks
- **Multiple data source connectors** (CSV, Google Sheets, PostgreSQL, REST API)

### 📡 Communication Integration
- **WhatsApp Cloud API** integration
- **Multi-channel messaging** abstraction: Telegram, Discord, Slack, Facebook
- **Google services**: Drive (readonly), Gmail (modify), Calendar, Sheets, Meet, Photos

### 🔐 Authentication & Security
- **JWT-based authentication** with access + refresh token rotation
- **Google OAuth 2.0** (server-to-server token exchange with FastAPI)
- **NextAuth v5** (credentials + Google provider) with backend JWT bridging
- **Token blacklisting** in Redis
- **AES-256-GCM encryption** for integration tokens at rest
- **Rate limiting**: sliding-window per IP/endpoint backed by Redis
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- **Account management**: delete, export (GDPR/LGPD compliant), password reset via email (Resend)

### 🌍 Internationalization
- **11 languages**: Portuguese, English, Spanish, French, German, Italian, Russian, Japanese, Chinese, Arabic, Hindi
- **RTL support** for Arabic
- **Locale detection disabled** — user choice respected via UI language switcher
- **next-intl** with static generation of all locale pages

### 📈 Observability
- **Prometheus metrics**: 15+ custom metrics (requests, latency, OCR, workflows, WebSocket connections)
- **Grafana dashboards** with pre-configured provisioning
- **Sentry** error tracking (backend + frontend)
- **Structured logging** via `structlog`

### 🧪 DevOps & Quality
- **CI/CD pipeline**: GitHub Actions — lint, type-check, test, build, security scan
- **Static analysis**: Ruff (Python), ESLint (TypeScript), Mypy, Pyright
- **Security scanning**: CodeQL (SAST), OWASP ZAP (DAST), Trivy (container vulnerability)
- **Docker multi-stage build**: Poetry → slim runtime with system deps (Tesseract, Poppler, OpenCV)
- **Docker Compose**: 6 services (API, PostgreSQL 16, Redis 7, Prometheus, Grafana, Node Exporter)

---

## 🏗 Architecture

The platform follows **Clean Architecture** (Hexagonal/Ports & Adapters) on the backend and a modern **Next.js App Router** structure on the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                      │
│  Next.js 16 App Router · React 19 · Tailwind · shadcn/ui   │
│  Zustand Stores · React Hook Form · Zod · next-intl        │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend Host)                   │
│  Next.js SSR/ISR · API Rewrites → Backend · Sentry         │
└───────────────────────┬─────────────────────────────────────┘
                        │  /api/v1/* proxy
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY (Backend Host)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ENTRYPOINTS LAYER                       │   │
│  │  REST Routers (15+) · WebSocket · Middleware · Deps  │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │             APPLICATION LAYER                        │   │
│  │  Use Cases · DTOs · Application Services            │   │
│  │  (auth, agents, workflows, automations, OCR)        │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │               DOMAIN LAYER                           │   │
│  │  Entities · Value Objects · Domain Events            │   │
│  │  Repository Interfaces · Service Protocols           │   │
│  │  (Agent, Workflow, AutomationRun, User, OCR)         │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │           INFRASTRUCTURE LAYER                       │   │
│  │  SQLAlchemy Models · Repositories · AI Providers     │   │
│  │  OCR (Tesseract) · Cache (Redis) · Email (Resend)   │   │
│  │  Security (JWT, bcrypt, AES) · Monitoring (Prom)    │   │
│  │  Integrations (11 services) · AWS S3/Lambda          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              EXTERNAL SERVICES                       │   │
│  │  PostgreSQL 16 · Redis 7 · Prometheus · Grafana     │   │
│  │  Gemini API · Ollama · OpenAI · Sentry · AWS        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

| Pattern | Where Used |
|---------|-----------|
| **Strategy** | LLM providers (Gemini ↔ Ollama ↔ OpenAI), OCR engines (Tesseract ↔ Textract ↔ Google Vision) |
| **Factory** | `provider_factory.py` (LLM), `ocr/factory.py` (OCR), `workflow/factory.py` (execution engine) |
| **Repository** | Abstract interfaces in `domain/repositories/`, SQLAlchemy implementations in `infrastructure/repositories/` |
| **Protocol** | `LLMProvider`, `OCRProvider`, `IntegrationProvider` — structural subtyping via `typing.Protocol` |
| **Observer** | Domain events (`UserRegistered`, `WorkflowApproved`, `WorkflowCompleted`) collected internally and dispatched externally |
| **Dependency Injection** | FastAPI `Depends()`: `get_db`, `get_current_user`, `get_redis_client`, service factories |
| **Middleware Chain** | Request ID → Timing/Prometheus → Rate Limiting → CORS → Security Headers |

---

## 🛠 Tech Stack

### Back-end

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | FastAPI | 0.115+ |
| **Server** | Uvicorn | 0.30+ |
| **Language** | Python | 3.11 |
| **ORM** | SQLAlchemy (async) | 2.0+ |
| **Database** | PostgreSQL 16 (via asyncpg) | — |
| **Migrations** | Alembic | 1.13+ |
| **Cache / Queue** | Redis 7 | — |
| **Auth** | python-jose (JWT), passlib (bcrypt), authlib (OAuth) | — |
| **AI / LLM** | Google Gemini, Ollama, OpenAI, CrewAI, LangChain | — |
| **OCR** | Tesseract, EasyOCR, OpenCV, pdf2image, Pillow | — |
| **Email** | Resend | — |
| **Monitoring** | Prometheus, Sentry, structlog | — |
| **Rate Limiting** | slowapi + Redis sliding-window | — |
| **Validation** | Pydantic v2 + pydantic-settings | — |
| **Cloud** | boto3 (S3, Lambda, SNS) | — |
| **Testing** | pytest, pytest-asyncio, pytest-cov | — |
| **Linting** | Ruff, Mypy, Pyright | — |
| **Package Mgmt** | Poetry | — |

### Front-end

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js (Turbopack) | 16.2 |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 19.2 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix primitives) | — |
| **State** | Zustand | 5.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Auth** | NextAuth v5 (Auth.js) | 5.0 beta |
| **i18n** | next-intl | 4.x |
| **Icons** | Lucide React, React Icons, Simple Icons | — |
| **Diagrams** | Mermaid | 11.x |
| **Monitoring** | @sentry/nextjs | 10.x |
| **Utilities** | clsx, tailwind-merge, class-variance-authority | — |

### DevOps / Infrastructure

| Category | Technology |
|----------|-----------|
| **CI/CD** | GitHub Actions (6-stage pipeline) |
| **Containerization** | Docker (multi-stage) + Docker Compose (6 services) |
| **Hosting** | Railway (backend) + Vercel (frontend) |
| **Security** | CodeQL, OWASP ZAP, Trivy |
| **Monitoring** | Prometheus + Grafana + Node Exporter |

---

## 📁 Project Structure

```
Pytomatiza+/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                    # Full CI/CD pipeline (lint, test, security, deploy)
│
├── Back-end/
│   ├── .env.example                     # Annotated environment variable template
│   ├── Dockerfile                       # Multi-stage: Poetry builder → slim runtime
│   ├── docker-compose.yaml              # 6 services: api, postgres, redis, prometheus, grafana, node-exporter
│   ├── Makefile                         # 20+ convenience commands (install, test, migrate, lint)
│   ├── alembic.ini                      # Database migration configuration
│   ├── pyproject.toml                   # Poetry deps + Ruff/Mypy/Pytest/Pyright config
│   ├── poetry.lock                      # Locked dependency tree
│   ├── infra/
│   │   ├── prometheus/prometheus.yml    # Prometheus scrape config (API, postgres, redis, node)
│   │   └── grafana/provisioning/        # Grafana datasources & dashboards
│   └── src/pytomatiza/
│       ├── main.py                      # FastAPI app factory + router registration
│       ├── config.py                    # Pydantic Settings (100+ env vars with validators)
│       ├── core/
│       │   └── s3_paths.py              # S3 key generation utilities
│       ├── domain/
│       │   ├── entities/                # Agent, User, Workflow, AutomationRun, IntegrationToken
│       │   ├── value_objects/           # Email
│       │   ├── events/                  # UserRegistered, WorkflowApproved, WorkflowCompleted
│       │   ├── repositories/            # Abstract interfaces (AgentRepo, UserRepo, WorkflowRepo)
│       │   ├── services/                # Domain protocols (LLMProvider, OCRProvider, IntegrationProvider)
│       │   │   ├── agent_capability.py  # 5 agent types with tools, keywords, intent matching
│       │   │   ├── llm_provider.py      # LLMProvider Protocol
│       │   │   ├── ocr/                 # OCRProvider Protocol + models + exceptions
│       │   │   └── integrations/        # IntegrationProvider ABC + OAuth config
│       │   └── exceptions/              # DomainException, EntityNotFound, BusinessRuleViolation, etc.
│       ├── application/
│       │   ├── dtos/                    # Pydantic DTOs for all API boundaries (10 files)
│       │   ├── use_cases/               # Command/Query use cases (auth, agents, workflows, automations)
│       │   └── services/                # Application services (OCR, OAuth, email, token, integrations)
│       ├── infrastructure/
│       │   ├── db/                      # SQLAlchemy Base, session engine, ORM models (6 models)
│       │   ├── repositories/            # SQLAlchemy implementations (7 repository classes)
│       │   ├── ai/                      # LLM providers (Gemini, Ollama) + factory
│       │   ├── ocr/                     # Tesseract provider, extraction (regex patterns), preprocessing
│       │   ├── security/                # JWT token service, password hasher (bcrypt), token encryption (AES-256-GCM)
│       │   ├── cache/                   # Redis client (async, decode_responses)
│       │   ├── email/                   # Resend email service
│       │   ├── monitoring/              # Prometheus metrics (15+ metrics) + Sentry setup
│       │   ├── integrations/            # 11 integration providers (WhatsApp, Slack, Discord, etc.)
│       │   ├── workflow/                # Execution engine + integration/OCR/OpenAI step executors
│       │   └── aws/                     # S3 client, Lambda invocation
│       ├── entrypoints/
│       │   ├── api/
│       │   │   ├── deps.py              # FastAPI dependencies (get_db, get_current_user, get_redis)
│       │   │   ├── middleware.py         # RequestID, Timing/Prometheus, RateLimit (Redis), SecurityHeaders, exception handlers
│       │   │   └── routers/             # 16+ route modules (auth, agents, workflows, automations, OCR, media, data, etc.)
│       │   └── websocket/
│       │       └── ws_handler.py        # WebSocket manager + /ws/agents endpoint (JWT auth)
│       └── tests/
│           ├── conftest.py              # Shared fixtures (sample_user, sample_agent, mocks)
│           ├── unit/
│           │   ├── domain/              # Entity tests, OCR field extraction tests
│           │   └── application/         # Use case tests
│           └── integration/
│               └── api/                 # Full API integration tests
│
├── Front-end/
│   ├── package.json                     # Dependencies (Next.js 16, React 19, Tailwind 4, etc.)
│   ├── next.config.ts                   # Next.js config (i18n, rewrites, security headers, Sentry)
│   ├── tsconfig.json                    # TypeScript strict config
│   ├── eslint.config.mjs                # ESLint flat config
│   ├── postcss.config.mjs               # PostCSS with Tailwind
│   ├── messages/                        # 11 JSON translation files (pt, en, es, fr, de, it, ru, ja, zh, ar, hi)
│   ├── public/                          # Static assets (logos, images)
│   ├── scripts/                         # Dev utilities (i18n fixer, translator, linter)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx               # Root layout (html, body, fonts, SessionProvider)
│       │   ├── globals.css              # Tailwind + CSS custom properties (tokens)
│       │   ├── [locale]/                # Next-intl locale routing
│       │   │   ├── layout.tsx           # Locale layout (NextIntlClientProvider, RTL support)
│       │   │   ├── (auth)/login/        # Login page (credentials + Google OAuth)
│       │   │   ├── (dashboard)/         # Authenticated routes group
│       │   │   │   ├── layout.tsx       # Dashboard shell (navbar, aura background, footer)
│       │   │   │   ├── dashboard/       # Dashboard page (server-fetched stats + agents)
│       │   │   │   ├── agents/          # Agent management pages
│       │   │   │   ├── automations/     # Automation run history
│       │   │   │   ├── workflows/       # Workflow builder
│       │   │   │   ├── communication/   # Multi-channel messaging
│       │   │   │   ├── data/            # Data analysis interface
│       │   │   │   ├── documents/       # OCR document processing
│       │   │   │   ├── media/           # Media transformation
│       │   │   │   ├── files/           # File storage management
│       │   │   │   ├── logs/            # Execution logs + pending approvals
│       │   │   │   ├── settings/        # 10 settings panels (account, security, appearance, etc.)
│       │   │   │   └── help/            # Help & documentation
│       │   │   └── privacy-policy/      # Privacy policy consent page
│       │   └── api/auth/[...nextauth]/  # NextAuth API route handler
│       ├── components/
│       │   ├── auth/                    # AuthForm, BrandPanel, GoogleButton
│       │   ├── layout/                  # DashboardShell, Navbar, Header, AuraBackground, SessionProvider, ThemeScript, AccentColorScript, LocaleUpdater, MobileMenu, ModulesDropdown, AppearanceSync
│       │   ├── dashboard/               # AgentCard, StatsCard, IntegrationPanel, IntegrationChips, DashboardSkeletons
│       │   ├── settings/                # 10 settings panel components (Accessibility, Account, Appearance, Security, Privacy, etc.)
│       │   ├── automations/             # Automation run components
│       │   ├── landing/                 # Landing page components
│       │   ├── legal/                   # Privacy policy, terms
│       │   └── ui/                      # Reusable UI: Button, Input, PasswordInput, Spinner, Skeleton, SkipLink, ThemeToggle, LanguageSwitcher, AccentColorPicker, LoginOverlay, LoginAlert, GoogleIcons
│       ├── hooks/
│       │   └── useInView.ts             # Intersection Observer hook
│       ├── lib/
│       │   ├── auth.ts                  # NextAuth v5 config (Credentials + Google, JWT callbacks, token refresh)
│       │   ├── api.ts                   # Typed API client (clientFetch, serverFetch, retry, health checks, error classification)
│       │   ├── utils.ts                 # cn() utility (clsx + tailwind-merge)
│       │   ├── useGoogleIntegration.ts  # Google Drive/Photos integration hook
│       │   └── validations/             # Zod schemas (auth.ts, workflow.ts)
│       ├── store/                       # Zustand stores (agent, theme, ui, settings, accentColor)
│       ├── i18n/
│       │   ├── config.ts                # Locale definitions + RTL detection (11 locales)
│       │   ├── request.ts               # next-intl request config (lazy message loading)
│       │   └── navigation.ts            # i18n-aware Link/redirect utilities
│       └── proxy.ts                     # next-intl middleware (locale routing, no auto-detection)
│
├── .gitattributes
├── .gitignore
└── Pytomatiza.code-workspace            # VS Code multi-root workspace
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.11.x | Backend runtime |
| **Poetry** | 2.x | Python dependency management |
| **Node.js** | 20 LTS | Frontend runtime |
| **npm** | 10+ | Frontend package manager |
| **Docker** | 24+ | Containerized infrastructure (optional for dev) |
| **PostgreSQL** | 16 | Primary database (if not using Docker) |
| **Redis** | 7 | Cache & rate limiting (if not using Docker) |
| **Tesseract** | 5.x | OCR engine (system dependency) |

### Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone <repo-url> && cd Pytomatiza+

# 2. Configure environment
cp Back-end/.env.example Back-end/.env
# Edit Back-end/.env — at minimum set JWT_SECRET and DATABASE_URL

# 3. Start all services (API, Postgres, Redis, Prometheus, Grafana)
cd Back-end
docker compose up -d

# 4. Apply database migrations
docker compose exec api alembic upgrade head

# 5. Verify
curl http://localhost:8000/api/v1/health
# → {"status":"healthy","database":"connected","redis":"connected"}

# 6. Start frontend
cd ../Front-end
npm install
cp .env.local.example .env.local  # if exists
npm run dev
# → http://localhost:3000
```

### Local Development (No Docker)

```bash
# ── Backend ────────────────────────────────────────────────
cd Back-end

# Install Python deps
poetry install

# Ensure PostgreSQL and Redis are running locally, then:
# Edit .env to point DATABASE_URL and REDIS_URL to localhost

# Run migrations
poetry run alembic upgrade head

# Start dev server with hot reload
poetry run uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000

# ── Frontend ───────────────────────────────────────────────
cd ../Front-end

# Install Node deps
npm install

# Create .env.local with:
#   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
#   AUTH_SECRET=<generate with: openssl rand -base64 32>
#   AUTH_GOOGLE_ID=<your-google-client-id>
#   AUTH_GOOGLE_SECRET=<your-google-client-secret>

npm run dev
# → http://localhost:3000
```

---

## ⚙️ Configuration

### Backend Environment Variables

All backend configuration is managed via `Back-end/.env`. Below are the critical categories. See `Back-end/.env.example` for the complete annotated template.

#### Core Application

```bash
ENVIRONMENT=development          # development | staging | production
DEBUG=true
LOG_LEVEL=INFO
```

#### Security & JWT

```bash
JWT_SECRET=<256-bit-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080    # 7 days
REFRESH_TOKEN_EXPIRE_DAYS=30
ENCRYPTION_KEY=<64-char-hex>        # AES-256-GCM for integration tokens
```

#### Database & Cache

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/Pytomatiza
REDIS_URL=redis://:password@host:6379/0
```

> **Note:** The `DATABASE_URL` validator automatically converts `postgresql://` to `postgresql+asyncpg://` for Railway compatibility.

#### AI / LLM Provider

```bash
LLM_PROVIDER=gemini               # gemini | ollama | openai
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=4096

# Gemini
GOOGLE_GEMINI_API_KEY=<your-key>
GOOGLE_GEMINI_MODEL=gemini-2.5-flash

# Ollama (local dev)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# OpenAI (legacy)
OPENAI_API_KEY=<your-key>
CREWAI_MODEL=gpt-4o
```

#### OCR

```bash
OCR_PROVIDER=tesseract             # tesseract | textract | google_vision | azure
OCR_LANGUAGE=por                   # ISO 639-3 code
OCR_ENABLED=true
OCR_TIMEOUT=30
OCR_MAX_FILE_SIZE_MB=10
OCR_MAX_PAGES=50
```

#### Integrations

```bash
# WhatsApp
WHATSAPP_ACCESS_TOKEN=<token>
WHATSAPP_PHONE_NUMBER_ID=<id>

# Discord, Telegram, Slack, Facebook, Trello, Jira, Zoom...
# See .env.example for all integration token variables
```

#### Frontend URL & CORS

```bash
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend Environment Variables

```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000    # FastAPI backend (required for SSR)
NEXTAUTH_URL=http://localhost:3000               # NextAuth canonical URL
NEXTAUTH_SECRET=<generate-with-openssl>          # Auth.js encryption key
AUTH_GOOGLE_ID=<google-client-id>                # Google OAuth client ID
AUTH_GOOGLE_SECRET=<google-client-secret>        # Google OAuth client secret
```

---

## 📡 API Overview

The backend exposes a REST API at `/api/v1/`. Interactive docs are available at:

- **Swagger UI**: `http://localhost:8000/docs` (disabled in production)
- **Health**: `GET /api/v1/health`
- **Metrics**: `GET /metrics` (Prometheus)

### Endpoint Summary

| Prefix | Tag | Description |
|--------|-----|-------------|
| `/api/v1/auth` | Auth | Register, login, logout, refresh, password reset, Google token exchange, `/me` CRUD, data export |
| `/api/v1/agents` | Agents | List, get, activate/deactivate, run (with NL prompt), pause, resume |
| `/api/v1/workflows` | Workflows | Create from NL, list, approve, deny, execute, delete |
| `/api/v1/automations` | Automations | List automation runs with pagination |
| `/api/v1/dashboard` | Dashboard | Stats (active agents, automations today, success rate, pending approvals) |
| `/api/v1/integrations` | Integrations | List, health check, execute action, disconnect |
| `/api/v1/ocr` | OCR | File upload + text extraction, provider health check |
| `/api/v1/media` | Media | Image transform (resize, compress, grayscale, blur, sharpen) |
| `/api/v1/data` | Data | Natural language data analysis, list data sources |
| `/api/v1/communication` | Communication | Send messages, list channel statuses |
| `/api/v1/storage` | Storage | File upload/download to S3 (if configured) |
| `/api/v1/architecture` | Architecture | Generate architecture diagrams from NL via LLM |
| `/api/v1/logs` | Logs | Execution logs, stats, pending approvals |
| `/api/v1/status` | Status | System status endpoints |
| `/ws/agents` | WebSocket | Real-time agent status updates (JWT auth via query param) |

### Authentication Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Browser  │       │ NextAuth │       │ FastAPI  │
│ (Next.js) │       │ (auth.js)│       │ Backend  │
└────┬─────┘       └────┬─────┘       └────┬─────┘
     │                   │                  │
     │  POST /login      │                  │
     │  (email+pass)     │                  │
     │──────────────────>│                  │
     │                   │  POST /api/v1/   │
     │                   │  auth/login      │
     │                   │─────────────────>│
     │                   │  {access_token,  │
     │                   │   refresh_token} │
     │                   │<─────────────────│
     │  JWT session      │                  │
     │  cookie set       │                  │
     │<──────────────────│                  │
     │                   │                  │
     │  Fetch /api/v1/*  │                  │
     │  (Bearer token    │                  │
     │   from session)   │                  │
     │─────────────────────────────────────>│
     │                   │                  │
     │  [Token expired?] │                  │
     │                   │  POST /auth/     │
     │                   │  refresh         │
     │                   │─────────────────>│
     │                   │  {new tokens}    │
     │                   │<─────────────────│
```

### Rate Limiting

- **General endpoints**: 60 requests/min per IP
- **Auth endpoints** (`/auth/*`): 10 requests/min per IP
- **Algorithm**: Redis sorted-set sliding window
- **Response**: `429 Too Many Requests` with `Retry-After` header

---

## 🧪 Testing

### Backend

```bash
cd Back-end

# All tests
make test                    # or: poetry run pytest

# Unit tests only
make test-unit               # or: poetry run pytest tests/unit

# Integration tests (requires PostgreSQL + Redis)
make test-integration        # or: poetry run pytest tests/integration

# With coverage
make test-cov                # HTML report in htmlcov/

# Linting & type checking
make lint                    # Ruff
make typecheck               # Mypy
make format                  # Ruff auto-format
```

**Test Structure:**
- `tests/unit/domain/` — Entity behavior, OCR field extraction, domain logic
- `tests/unit/application/` — Use cases with mocked repositories
- `tests/integration/api/` — Full API integration tests against real endpoints
- `tests/conftest.py` — Shared fixtures (sample entities, mock repositories, mock services)

### Frontend

```bash
cd Front-end

# Lint
npm run lint

# TypeScript check
npx tsc --noEmit

# Build (verifies full compilation)
npm run build
```

---

## 🚢 Deployment

### Production Architecture

```
                      ┌─────────────┐
                      │   Vercel    │
                      │  (Frontend) │
                      └──────┬──────┘
                             │  HTTPS
                             ▼
                      ┌─────────────┐
                      │   Railway   │
                      │  (Backend)  │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │PostgreSQL│  │  Redis   │  │ External │
        │   (16)   │  │   (7)    │  │   APIs   │
        └──────────┘  └──────────┘  └──────────┘
```

### Backend (Railway)

Railway provides `DATABASE_URL` and `REDIS_URL` automatically. The `DATABASE_URL` validator in `config.py` auto-converts the driver suffix.

```bash
# Deploy from GitHub
# Railway auto-detects Dockerfile and builds

# Or manually:
railway up
```

### Frontend (Vercel)

```bash
# Deploy
vercel --prod

# Environment variables to set in Vercel dashboard:
#   NEXT_PUBLIC_BACKEND_URL = https://your-app.railway.app
#   NEXTAUTH_URL = https://your-app.vercel.app
#   NEXTAUTH_SECRET = <random-string>
#   AUTH_GOOGLE_ID = <google-client-id>
#   AUTH_GOOGLE_SECRET = <google-client-secret>
```

The frontend proxies `/api/v1/*` requests to the backend via Next.js rewrites, eliminating CORS issues for client-side fetches.

### Docker Self-Hosting

```bash
cd Back-end
docker compose -f docker-compose.yaml up -d --build
```

This starts all 6 services with health checks, volumes, and proper dependency ordering.

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **Authentication** | JWT (HS256) with access + refresh tokens; Redis-based token blacklisting |
| **Password Hashing** | bcrypt via passlib |
| **OAuth 2.0** | Google OIDC with server-side id_token validation |
| **Token Encryption** | AES-256-GCM for integration tokens at rest |
| **Rate Limiting** | Redis sorted-set sliding window per IP + endpoint |
| **CORS** | Configurable allowlist via `CORS_ORIGINS` |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Permissions-Policy |
| **Input Validation** | Pydantic v2 (backend), Zod (frontend) |
| **SAST** | CodeQL (Python + JavaScript) in CI |
| **DAST** | OWASP ZAP baseline scan against live API in CI |
| **Container Scanning** | Trivy vulnerability scanner in CI |
| **Secrets Management** | Environment variables only — no secrets in code or config files |

---

## 📊 Observability

### Prometheus Metrics (Backend)

| Metric | Type | Labels |
|--------|------|--------|
| `pytomatiza_request_total` | Counter | method, endpoint, status_code |
| `pytomatiza_request_latency_seconds` | Histogram | method, endpoint |
| `pytomatiza_automation_runs_total` | Counter | agent_type, status |
| `pytomatiza_workflow_executions_total` | Counter | status |
| `pytomatiza_workflow_execution_seconds` | Histogram | — |
| `pytomatiza_agent_executions_total` | Counter | tool, status |
| `pytomatiza_ocr_requests_total` | Counter | provider, file_type |
| `pytomatiza_ocr_failures_total` | Counter | provider, reason |
| `pytomatiza_ocr_processing_seconds` | Histogram | provider |
| `pytomatiza_ocr_pages_processed_total` | Counter | provider |
| `pytomatiza_ocr_provider_usage_total` | Counter | provider, language |
| `pytomatiza_ws_connections_active` | Gauge | — |
| `pytomatiza_db_query_latency_seconds` | Histogram | operation |
| `pytomatiza_workflow_runs_total` | Counter | status |

**Access:** `http://localhost:9090` (Prometheus UI), `http://localhost:3001` (Grafana, admin/change-me)

### Sentry

Both backend (`sentry-sdk`) and frontend (`@sentry/nextjs`) report errors to Sentry. Configure via:

```bash
SENTRY_DSN=<your-dsn>              # Backend .env
NEXT_PUBLIC_SENTRY_DSN=<your-dsn>  # Frontend .env.local
```

---

## 🌍 Internationalization (i18n)

The platform supports **11 languages** using `next-intl`:

| Code | Language | RTL? |
|------|----------|------|
| `pt` | Português (default) | No |
| `en` | English | No |
| `es` | Español | No |
| `fr` | Français | No |
| `de` | Deutsch | No |
| `it` | Italiano | No |
| `ru` | Русский | No |
| `ja` | 日本語 | No |
| `zh` | 中文 | No |
| `ar` | العربية | **Yes** |
| `hi` | हिन्दी | No |

**Translation files** live in `Front-end/messages/` as JSON key-value pairs. The locale is part of the URL path (`/pt/dashboard`, `/en/dashboard`, etc.) and locale detection is disabled — the user's choice in the UI is always respected.

Utility scripts in `Front-end/scripts/` help maintain translation completeness across all 11 languages.

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository and create a feature branch from `develop`
2. **Set up** local development environment (see [Getting Started](#-getting-started))
3. **Follow the code style**:
   - Backend: Ruff (`make lint`), Mypy (`make typecheck`)
   - Frontend: ESLint (`npm run lint`), TypeScript strict mode
4. **Write tests** for new features
5. **Ensure all CI checks pass** before opening a PR
6. **PR target**: `develop` for features, `main` for hotfixes

### Code Quality Gates (CI)

| Gate | Tool | Threshold |
|------|------|-----------|
| Python linting | Ruff | Zero errors |
| Python formatting | Ruff | Consistent |
| Python type check | Mypy | Strict mode |
| JS/TS linting | ESLint | @next/eslint-config |
| TypeScript | tsc --noEmit | Zero errors |
| Unit + Integration tests | pytest | All passing |
| Code coverage | pytest-cov | Report generated |
| Security (SAST) | CodeQL | No new alerts |
| Security (DAST) | OWASP ZAP | No fatal errors |
| Container scan | Trivy | No CRITICAL/HIGH CVEs |

### Commit Convention

```
feat: add WhatsApp message template support
fix: resolve token refresh race condition
docs: update OCR provider configuration guide
test: add integration tests for workflow execution
refactor: extract AgentCapability to domain service
```

---

## 📝 License

Proprietary. All rights reserved.

---

## 👥 Team

Built and maintained by the **Pytomatiza Team** — `dev@pytomatiza.com`

---

<p align="center">
  <sub>Built with ⚡ by Pytomatiza Team · Powered by AI</sub>
</p>
