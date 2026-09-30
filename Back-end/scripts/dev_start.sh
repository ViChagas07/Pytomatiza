#!/usr/bin/env bash
# Script de inicialização do ambiente de desenvolvimento local
# Uso: ./scripts/dev_start.sh

set -e

echo "🚀 Iniciando ambiente de desenvolvimento Pytomatiza+"
echo "=================================================="

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker Desktop primeiro."
    exit 1
fi

# Verificar se arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local a partir do template..."
    cp .env.local.example .env.local
    echo "✅ .env.local criado. Edite se necessário."
else
    echo "✅ .env.local já existe"
fi

# Subir serviços necessários
echo ""
echo "🐳 Subindo containers de desenvolvimento..."
docker compose -f docker-compose.yaml -f docker-compose.override.yml --profile gpu up -d ollama postgres-dev redis-dev

# Aguardar serviços ficarem saudáveis
echo ""
echo "⏳ Aguardando serviços ficarem saudáveis..."

# PostgreSQL
echo "   PostgreSQL..."
for i in {1..30}; do
    if docker exec pytomatiza-postgres-dev pg_isready -U postgres -d Pytomatiza > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL pronto"
        break
    fi
    sleep 2
done

# Redis
echo "   Redis..."
for i in {1..30}; do
    if docker exec pytomatiza-redis-dev redis-cli -a redis ping > /dev/null 2>&1; then
        echo "   ✅ Redis pronto"
        break
    fi
    sleep 2
done

# Ollama
echo "   Ollama..."
for i in {1..60}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "   ✅ Ollama pronto"
        break
    fi
    sleep 2
done

# Baixar modelos se não existirem
echo ""
echo "🤖 Verificando modelos Ollama..."
if ! ollama list | grep -q "qwen3:4b"; then
    echo "   Baixando qwen3:4b (recomendado para seu hardware)..."
    ollama pull qwen3:4b
else
    echo "   ✅ qwen3:4b já disponível"
fi

# Rodar migrações do banco
echo ""
echo "🗄️  Rodando migrações do banco de dados..."
cd "$(dirname "$0")/.."
alembic upgrade head

echo ""
echo "✨ Ambiente de desenvolvimento pronto!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Backend:  uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000"
echo "   2. Frontend: cd ../Front-end && npm run dev"
echo "   3. Acesse:   http://localhost:3000"
echo ""
echo "🔧 Variáveis de ambiente ativas:"
echo "   LLM_PROVIDER=ollama"
echo "   OLLAMA_MODEL=qwen3:4b"
echo "   MOCK_INTEGRATIONS=true"
echo "   ENVIRONMENT=development"