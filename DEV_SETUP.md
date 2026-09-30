# 🛠️ Guia de Desenvolvimento Local — Pytomatiza+

Configuração completa para rodar o Pytomatiza+ localmente com **LLM gratuito (Ollama + Qwen3 4B)** e **Mock Integrations** para demonstrações em entrevistas.

---

## 🎯 Objetivo

- ✅ **Zero custo**: LLM local via Ollama (Qwen3 4B roda na sua RX 6500 XT 8GB)
- ✅ **Demo pronto**: Mock de Slack, Jira, Discord, Trello, Zoom, Google Drive, Gmail, WhatsApp, Telegram
- ✅ **Produção intacta**: Suas credenciais reais ficam no `.env` (produção), dev usa `.env.local`
- ✅ **Fácil alternância**: Troca entre `gemini` (prod) e `ollama` (dev) com uma variável

---

## 💻 Requisitos de Hardware

| Componente | Seu Hardware | Requisito Mínimo | Status |
|------------|--------------|------------------|--------|
| **GPU** | RX 6500 XT 8GB | 6GB VRAM | ✅ Ideal |
| **RAM** | 16GB | 8GB | ✅ Sobra |
| **CPU** | Ryzen 7 5800X | 4 cores | ✅ Ótimo |
| **Disco** | SSD | 10GB livres | ✅ |

> **Qwen3 4B** usa ~2.5GB VRAM (quantizado q4_K_M) — sobra VRAM para o SO e outros apps.

---

## 🚀 Início Rápido (Windows PowerShell)

```powershell
# 1. Clonar e entrar no backend
cd D:\Pytomatiza+\Back-end

# 2. Executar script de inicialização (faz tudo automático)
.\scripts\dev_start.ps1

# 3. Em outro terminal, iniciar backend
uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000

# 4. Em outro terminal, iniciar frontend
cd ..\Front-end
npm run dev

# 5. Acessar: http://localhost:3000
```

---

## 📋 Passo a Passo Detalhado

### 1. Preparar Variáveis de Ambiente

```powershell
# Copiar template para arquivo local (não versionado)
Copy-Item .env.local.example .env.local
```

O `.env.local` já vem configurado com:
```ini
ENVIRONMENT=development
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3:4b
MOCK_INTEGRATIONS=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/Pytomatiza
REDIS_URL=redis://:redis@localhost:6379/0
```

### 2. Subir Infraestrutura (Docker)

**Com GPU (recomendado para sua RX 6500 XT):**
```powershell
docker compose -f docker-compose.yaml -f docker-compose.override.yml --profile gpu up -d ollama postgres-dev redis-dev
```

**CPU apenas (fallback):**
```powershell
docker compose -f docker-compose.yaml -f docker-compose.override.yml --profile cpu up -d ollama-cpu postgres-dev redis-dev
```

### 3. Baixar Modelos Ollama

```powershell
# Opção 1: Script automático
.\scripts\init_ollama_models.ps1

# Opção 2: Manual
ollama pull qwen3:4b
ollama pull qwen3:4b-instruct-q4_K_M
ollama pull llama3.2:3b
```

### 4. Migrações do Banco

```powershell
alembic upgrade head
```

### 5. Iniciar Aplicação

**Terminal 1 - Backend:**
```powershell
uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd ..\Front-end
npm run dev
```

### 6. Acessar

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Ollama API**: http://localhost:11434

---

## 🤖 Mock Integrations — Como Funciona

Quando `MOCK_INTEGRATIONS=true`, os seguintes provedores retornam **respostas realistas simuladas**:

| Integração | Ações Mockadas | Exemplo de Uso |
|------------|----------------|----------------|
| **Slack** | `send_message`, `list_channels`, `get_user` | Enviar alerta para #geral |
| **Jira** | `create_issue`, `get_issue`, `transition_issue`, `add_comment`, `search_issues` | Criar ticket MOCK-123 |
| **Discord** | `send_message`, `get_channels`, `create_webhook` | Postar no canal #dev |
| **Trello** | `create_card`, `get_boards`, `get_lists` | Adicionar cartão no Backlog |
| **Zoom** | `create_meeting`, `get_recordings` | Agendar reunião mock |
| **Google Drive** | `upload_file`, `list_files` | Upload de relatório.pdf |
| **Gmail** | `send_email`, `create_draft`, `search_messages` | Enviar email de boas-vindas |
| **WhatsApp** | `send_message`, `send_template` | Notificação via WhatsApp |
| **Telegram** | `send_message` | Alerta no bot |

### Exemplo de Workflow com Mocks

```yaml
# workflow exemplo para demo
steps:
  - tool: jira
    action: create_issue
    params:
      summary: "Bug crítico no login"
      description: "Usuários não conseguem acessar"
      project_key: "MOCK"
  
  - tool: slack
    action: send_message
    params:
      channel: "#alertas"
      text: "🚨 Novo bug criado: MOCK-A1B2 - Bug crítico no login"
  
  - tool: discord
    action: send_message
    params:
      channel_id: "123456789012345678"
      content: "📋 Issue **MOCK-A1B2** criada e notificada no Slack!"
  
  - tool: google_drive
    action: upload_file
    params:
      name: "relatorio_bug_MOCK-A1B2.pdf"
      mimeType: "application/pdf"
```

**Resultado**: Tudo "funciona" visualmente — você vê mensagens no Slack, issues no Jira, arquivos no Drive — mas **nenhuma chamada real de API é feita**.

---

## 🔄 Alternando entre Produção e Desenvolvimento

### Produção (suas credenciais reais)
```ini
# .env (já existe, não mexa)
ENVIRONMENT=production
LLM_PROVIDER=gemini
GOOGLE_GEMINI_API_KEY=sua_chave_real
MOCK_INTEGRATIONS=false
# ... tokens reais do Slack, Jira, Discord, etc.
```

### Desenvolvimento (gratuito, mockado)
```ini
# .env.local (criado pelo template)
ENVIRONMENT=development
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3:4b
MOCK_INTEGRATIONS=true
# ... tokens vazios (não precisam)
```

**O código detecta automaticamente** via `settings.MOCK_INTEGRATIONS` e `settings.LLM_PROVIDER`.

---

## 🎬 Preparando para Entrevistas

### Checklist Pré-Entrevista

- [ ] `docker compose --profile gpu up -d ollama postgres-dev redis-dev`
- [ ] `ollama list` mostra `qwen3:4b`
- [ ] Backend rodando: `uvicorn pytomatiza.main:app --reload`
- [ ] Frontend rodando: `npm run dev`
- [ ] Acesse http://localhost:3000 → Login → Crie um agente → Teste um prompt
- [ ] Crie um workflow com steps de Slack + Jira + Discord
- [ ] Execute o workflow → Veja os logs de execução "sucesso"

### Roteiro de Demo Sugerido (5 min)

1. **Login/Cadastro** (30s) — Mostra auth JWT + Google OAuth (mock se quiser)
2. **Criar Agente** (1min) — "Agente de Suporte Técnico" com ferramentas Slack/Jira
3. **Chat com Agente** (1min) — Pergunte: "Crie um ticket no Jira e avise no Slack"
4. **Workflow Visual** (1.5min) — Mostre o builder de workflows drag-and-drop
5. **Execução Real** (1min) — Rode o workflow → Mostre logs step-by-step com outputs mockados

### Talking Points

> "O backend usa **arquitetura hexagonal** (Domain-Driven Design) com **Strategy Pattern** para integrações. Cada provedor (Slack, Jira, etc.) implementa a interface `IntegrationProvider`. Em desenvolvimento, ativo `MOCK_INTEGRATIONS=true` e o `IntegrationService` injeta automaticamente `MockSlackProvider`, `MockJiraProvider`, etc. — **zero mudança no código de negócio**. Em produção, basta trocar a variável de ambiente e os provedores reais assumem com OAuth tokens por usuário criptografados em AES-256-GCM."

> "Para LLM, uso **Provider Factory** com `LLMProvider` protocol. Produção usa Gemini 2.5 Flash via API; desenvolvimento usa **Ollama local com Qwen3 4B** (quantizado 4-bit, ~2.5GB VRAM) — roda na minha RX 6500 XT sem custo. O código da aplicação não muda: `get_llm_provider()` retorna a implementação correta baseada em `settings.LLM_PROVIDER`."

---

## 🛠️ Comandos Úteis

### Gerenciar Ollama
```bash
# Ver modelos instalados
ollama list

# Remover modelo
ollama rm qwen3:4b

# Rodar modelo interativo (teste rápido)
ollama run qwen3:4b "Explique DDD em 2 frases"

# Ver logs do container
docker logs -f pytomatiza-ollama
```

### Banco de Dados
```bash
# Conectar no PostgreSQL local
docker exec -it pytomatiza-postgres-dev psql -U postgres -d Pytomatiza

# Resetar banco (cuidado!)
alembic downgrade base && alembic upgrade head
```

### Limpeza Total
```bash
# Parar e remover containers + volumes
docker compose -f docker-compose.yaml -f docker-compose.override.yml down -v

# Remover modelos Ollama
docker volume rm pytomatiza-ollama_data
```

---

## 🐛 Troubleshooting

### Ollama não inicia / GPU não detectada
```bash
# Verificar se Docker vê GPU
docker run --rm --gpus all nvidia/cuda:12.4-base nvidia-smi

# Se falhar: instalar NVIDIA Container Toolkit (Windows: WSL2 + driver)
# Ou use profile CPU:
docker compose --profile cpu up -d ollama-cpu
```

### Porta 11434 já em uso
```bash
# Verificar o que está usando
netstat -ano | findstr :11434

# Matar processo ou mudar porta no docker-compose.override.yml
```

### Modelo muito lento / OOM
```bash
# Usar versão quantizada menor (já incluída no script)
ollama pull qwen3:4b-instruct-q4_K_M

# No .env.local:
OLLAMA_MODEL=qwen3:4b-instruct-q4_K_M
```

### Mock não funciona
- Verifique `MOCK_INTEGRATIONS=true` no `.env.local`
- Reinicie o backend após mudar `.env.local` (o `lru_cache` em `get_settings()` cacheia)
- Logs: procure por `MOCK_INTEGRATIONS=true — registrando providers mock`

---

## 📁 Estrutura de Arquivos Criados

```
Back-end/
├── .env.local.example          # Template de variáveis dev (copie para .env.local)
├── docker-compose.override.yml # Override para Ollama + DBs locais
├── scripts/
│   ├── dev_start.ps1           # Inicialização completa (Windows)
│   ├── dev_start.sh            # Inicialização completa (Linux/Mac)
│   ├── init_ollama_models.ps1  # Download modelos (Windows)
│   └── init_ollama_models.sh   # Download modelos (Linux/Mac)
└── src/pytomatiza/
    ├── config.py               # + MOCK_INTEGRATIONS setting
    └── infrastructure/integrations/
        ├── mock_providers.py   # 🎭 Mock providers (Slack, Jira, Discord...)
        └── __init__.py         # Exports
```

---

## 🔐 Segurança

- `.env.local` está no `.gitignore` — **nunca commitado**
- `.env` (produção) continua intacto com suas credenciais reais
- Mock providers **não fazem chamadas de rede externas**
- Tokens mock são gerados em memória, não persistem

---

## 📚 Referências

- [Ollama Models](https://ollama.com/library) — Mais modelos para testar
- [Qwen3 4B](https://huggingface.co/Qwen/Qwen3-4B) — Modelo usado
- [Arquitetura Hexagonal no Pytomatiza+](./ARCHITECTURE.md) — Se existir
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/) — GPU vs CPU

---

**Dúvidas?** Abra uma issue ou veja os logs com `docker logs pytomatiza-ollama` e `uvicorn` output.