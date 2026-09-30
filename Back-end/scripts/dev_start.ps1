<# 
.SYNOPSIS
    Inicia ambiente de desenvolvimento local completo do Pytomatiza+

.DESCRIPTION
    Sobe containers (Ollama, PostgreSQL, Redis), baixa modelos, roda migrações
    e prepara tudo para desenvolvimento com mock integrations.

.USAGE
    .\scripts\dev_start.ps1
    .\scripts\dev_start.ps1 -SkipModels
    .\scripts\dev_start.ps1 -Profile cpu
#>

param(
    [switch]$SkipModels,
    [ValidateSet('gpu', 'cpu')]
    [string]$Profile = 'gpu'
)

Write-Host "🚀 Iniciando ambiente de desenvolvimento Pytomatiza+" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor DarkGray

# Verificar Docker
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

# Verificar .env.local
$envPath = ".\.env.local"
$examplePath = ".\.env.local.example"
if (-not (Test-Path $envPath)) {
    Write-Host "📝 Criando .env.local a partir do template..." -ForegroundColor Yellow
    Copy-Item $examplePath $envPath
    Write-Host "✅ .env.local criado. Edite se necessário." -ForegroundColor Green
} else {
    Write-Host "✅ .env.local já existe" -ForegroundColor Green
}

# Subir containers
Write-Host ""
Write-Host "🐳 Subindo containers de desenvolvimento (profile: $Profile)..." -ForegroundColor Cyan
$composeCmd = "docker compose -f docker-compose.yaml -f docker-compose.override.yml --profile $Profile up -d ollama postgres-dev redis-dev"
Write-Host "   Executando: $composeCmd" -ForegroundColor Gray
Invoke-Expression $composeCmd

# Aguardar serviços
Write-Host ""
Write-Host "⏳ Aguardando serviços ficarem saudáveis..." -ForegroundColor Yellow

# PostgreSQL
Write-Host "   PostgreSQL..." -NoNewline
for ($i = 1; $i -le 30; $i++) {
    try {
        docker exec pytomatiza-postgres-dev pg_isready -U postgres -d Pytomatiza | Out-Null
        Write-Host " ✅" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}

# Redis
Write-Host "   Redis..." -NoNewline
for ($i = 1; $i -le 30; $i++) {
    try {
        docker exec pytomatiza-redis-dev redis-cli -a redis ping | Out-Null
        Write-Host " ✅" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}

# Ollama
Write-Host "   Ollama..." -NoNewline
for ($i = 1; $i -le 60; $i++) {
    try {
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get | Out-Null
        Write-Host " ✅" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}

# Baixar modelos
if (-not $SkipModels) {
    Write-Host ""
    Write-Host "🤖 Verificando modelos Ollama..." -ForegroundColor Cyan
    $models = ollama list
    if ($models -notmatch "qwen3:4b") {
        Write-Host "   Baixando qwen3:4b (recomendado para RX 6500 XT 8GB)..." -ForegroundColor Yellow
        ollama pull qwen3:4b
    } else {
        Write-Host "   ✅ qwen3:4b já disponível" -ForegroundColor Green
    }
}

# Migrações
Write-Host ""
Write-Host "🗄️  Rodando migrações do banco de dados..." -ForegroundColor Cyan
Set-Location (Split-Path $PSScriptRoot)
alembic upgrade head

Write-Host ""
Write-Host "✨ Ambiente de desenvolvimento pronto!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Backend:  uvicorn pytomatiza.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Write-Host "   2. Frontend: cd ..\Front-end && npm run dev" -ForegroundColor Gray
Write-Host "   3. Acesse:   http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Variáveis de ambiente ativas:" -ForegroundColor Cyan
Write-Host "   LLM_PROVIDER=ollama" -ForegroundColor Gray
Write-Host "   OLLAMA_MODEL=qwen3:4b" -ForegroundColor Gray
Write-Host "   MOCK_INTEGRATIONS=true" -ForegroundColor Gray
Write-Host "   ENVIRONMENT=development" -ForegroundColor Gray