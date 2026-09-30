#!/usr/bin/env bash
# Script para inicializar modelos Ollama para desenvolvimento local
# Uso: ./scripts/init_ollama_models.sh

set -e

OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

echo "🤖 Inicializando modelos Ollama para desenvolvimento..."
echo "📡 Conectando em: $OLLAMA_URL"

# Aguardar Ollama estar pronto
echo "⏳ Aguardando Ollama ficar disponível..."
for i in {1..30}; do
    if curl -s "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama está pronto!"
        break
    fi
    echo "   Tentativa $i/30..."
    sleep 2
done

# Modelos recomendados para desenvolvimento
# Qwen3 4B - Perfeito para RX 6500 XT 8GB + 16GB RAM (~2.5GB VRAM)
MODELS=(
    "qwen3:4b"
    "qwen3:4b-instruct-q4_K_M"
    "llama3.2:3b"
    "mistral:7b-instruct-q4_K_M"
)

echo ""
echo "📥 Baixando modelos recomendados..."
for model in "${MODELS[@]}"; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Baixando: $model"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if ollama pull "$model"; then
        echo "✅ $model baixado com sucesso!"
    else
        echo "⚠️  Falha ao baixar $model (pode já existir ou erro de rede)"
    fi
done

echo ""
echo "📋 Modelos disponíveis:"
ollama list

echo ""
echo "✨ Pronto! Para usar no Pytomatiza+:"
echo "   1. Configure no .env.local: OLLAMA_MODEL=qwen3:4b"
echo "   2. Configure: LLM_PROVIDER=ollama"
echo "   3. Configure: MOCK_INTEGRATIONS=true"
echo "   4. Reinicie o backend"