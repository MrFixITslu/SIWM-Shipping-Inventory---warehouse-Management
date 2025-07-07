# Vision79 SIWM Development Setup Script for Windows

Write-Host "🚀 Setting up Vision79 SIWM for Development..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

# Create environment files if they don't exist
Write-Host "📝 Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env file not found. Please create it manually." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Created .env file" -ForegroundColor Green
    }
}

if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue
    if (-not (Test-Path "backend\.env")) {
        Write-Host "⚠️  backend\.env file not found. Please create it manually." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Created backend\.env file" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
npm install

Write-Host "Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm install
Set-Location ..

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Generate secrets
Write-Host "🔐 Generating application secrets..." -ForegroundColor Yellow
npm run generate-secrets

# Check if Docker is available for database
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
    
    Write-Host "🐳 Starting database services..." -ForegroundColor Yellow
    docker compose up -d postgres redis
    
    Write-Host "✅ Database services started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not available. You'll need to start PostgreSQL and Redis manually." -ForegroundColor Yellow
    Write-Host "   - PostgreSQL should be running on localhost:5432" -ForegroundColor Blue
    Write-Host "   - Redis should be running on localhost:6379" -ForegroundColor Blue
}

# Start the application
Write-Host "🚀 Starting the application..." -ForegroundColor Yellow
Write-Host "   Frontend will be available at: http://localhost:5173" -ForegroundColor Blue
Write-Host "   Backend API will be available at: http://localhost:4000" -ForegroundColor Blue
Write-Host "   Press Ctrl+C to stop the application" -ForegroundColor Blue

npm run dev 