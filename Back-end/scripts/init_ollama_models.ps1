<# 
.SYNOPSIS
    Inicializa modelos Ollama para desenvolvimento local do Pytomatiza+

.DESCRIPTION
    Baixa modelos recomendados (Qwen3 4B, Llama 3.2, Mistral) otimizados para 
    hardware com 8GB VRAM (RX 6500 XT) + 16GB RAM.

.USAGE
    .\scripts\init_ollama_models.ps1
    .\scripts\init_ollama_models.ps1 -OllamaUrl "http://localhost:11434"
    .\scripts\init_ollama_models.ps1 -Models "qwen3:4b", "llama3.2:3b"

.NOTES
    Requer Ollama instalado e rodando (docker compose --profile gpu up -d ollama)
#>

param(
    [string]$OllamaUrl = "http://localhost:11434",
    [string[]]$Models = @(
        "qwen3:4b",
        "qwen3:4b-instruct-q4_K_M",
        "llama3.2:3b",
        "mistral:7b-instruct-q4_K_M"
    )
)

Write-Host "🤖 Inicializando modelos Ollama para desenvolvimento..." -ForegroundColor Cyan
Write-Host "📡 Conectando em: $OllamaUrl" -ForegroundColor Gray

# Aguardar Ollama estar pronto
Write-Host "⏳ Aguardando Ollama ficar disponível..." -ForegroundColor Yellow
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$OllamaUrl/api/tags" -Method Get -ErrorAction Stop
        Write-Host "✅ Ollama está pronto!" -ForegroundColor Green
        break
    } catch {
        Write-Host "   Tentativa $i/30..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if ($i -gt 30) {
    Write-Host "❌ Timeout: Ollama não respondeu após 60 segundos" -ForegroundColor Red
    exit 1
}

# Baixar modelos
Write-Host "" 
Write-Host "📥 Baixando modelos recomendados..." -ForegroundColor Cyan

foreach ($model in $Models) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📦 Baixando: $model" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    try {
        # ollama pull não retorna output streaming no Windows facilmente, 
        # então usamos o CLI diretamente
        $result = ollama pull $model 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $model baixado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Aviso ao baixar $model: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Falha ao baixar $model: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 Modelos disponíveis:" -ForegroundColor Cyan
ollama list

Write-Host ""
Write-Host "✨ Pronto! Para usar no Pytomatiza+:" -ForegroundColor Green
Write-Host "   1. Configure no .env.local: OLLAMA_MODEL=qwen3:4b" -ForegroundColor Gray
Write-Host "   2. Configure: LLM_PROVIDER=ollama" -ForegroundColor Gray
Write-Host "   3. Configure: MOCK_INTEGRATIONS=true" -ForegroundColor Gray
Write-Host "   4. Reinicie o backend" -ForegroundColor Gray