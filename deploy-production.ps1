# Vision79 SIWM Production Deployment Script for Windows
# This script sets up the application for production deployment on Windows

param(
    [switch]$SkipDocker,
    [switch]$Development
)

Write-Host "🚀 Starting Vision79 SIWM Production Deployment..." -ForegroundColor Green

# Colors for output
$Red = 'Red'
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Blue'

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed"
    exit 1
}

# Check Docker (optional)
try {
    $dockerVersion = docker --version
    Write-Success "Docker version: $dockerVersion"
} catch {
    Write-Warning "Docker is not installed. Some features may not work."
}

# Check Docker Compose (optional)
try {
    $composeVersion = docker compose version
    Write-Success "Docker Compose version: $composeVersion"
} catch {
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose version: $composeVersion"
    } catch {
        Write-Warning "Docker Compose is not installed. Some features may not work."
    }
}

# Create production environment files
Write-Status "Setting up environment files..."

# Frontend production environment
if (-not (Test-Path ".env.production")) {
    @"
# ========================================
# VISION79 SIWM - PRODUCTION ENVIRONMENT
# ========================================

# Application Configuration
VITE_APP_NAME=Vision79 SIWM
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# API Configuration
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_LOGISTICS_OPTIMIZATION=true

# External Services
VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com

# Security
VITE_ENABLE_HTTPS=true
VITE_ENABLE_CSP=true

# Performance
VITE_ENABLE_CACHING=true
VITE_ENABLE_COMPRESSION=true

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your-sentry-dsn
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Success "Created .env.production"
} else {
    Write-Warning ".env.production already exists"
}

# Backend production environment
if (-not (Test-Path "backend\.env.production")) {
    @"
# ========================================
# VISION79 SIWM BACKEND - PRODUCTION ENVIRONMENT
# ========================================

# Application Configuration
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
APP_NAME=Vision79 SIWM Backend
APP_VERSION=1.0.0

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters-long-and-random
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-key-here-minimum-32-characters
BCRYPT_ROUNDS=12

# Database Configuration
DB_USER=vision79_prod_user
DB_PASSWORD=your-secure-database-password-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vision79_production
DB_SSL=false

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# AI Services Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash-preview-04-17

# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME="Vision79 SIWM Notifications"

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX_REQUESTS=50
API_RATE_LIMIT_MAX_REQUESTS=1000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Performance Configuration
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
CACHE_ENABLED=true
CACHE_TTL=3600

# Security Headers
SECURITY_HEADERS_ENABLED=true
CSP_ENABLED=true
HSTS_ENABLED=true
"@ | Out-File -FilePath "backend\.env.production" -Encoding UTF8
    Write-Success "Created backend\.env.production"
} else {
    Write-Warning "backend\.env.production already exists"
}

# Install dependencies
Write-Status "Installing dependencies..."

# Frontend dependencies
Write-Status "Installing frontend dependencies..."
npm install

# Backend dependencies
Write-Status "Installing backend dependencies..."
Set-Location backend
npm install
Set-Location ..

Write-Success "Dependencies installed successfully"

# Generate secrets
Write-Status "Generating application secrets..."
npm run generate-secrets

# Build the application
Write-Status "Building the application for production..."

# Build frontend
Write-Status "Building frontend..."
npm run build

# Build backend (if needed)
Write-Status "Building backend..."
Set-Location backend
npm run build:prod
Set-Location ..

Write-Success "Application built successfully"

# Create logs directory
Write-Status "Creating logs directory..."
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# Create deployment script
Write-Status "Creating deployment script..."

@"
# Vision79 SIWM Deployment Script for Windows

Write-Host "🚀 Deploying Vision79 SIWM..." -ForegroundColor Green

# Pull latest changes
git pull origin main

# Install dependencies
npm install
Set-Location backend
npm install
Set-Location ..

# Build application
npm run build:prod

# Start services (if using PM2 or similar)
# pm2 restart vision79-backend
# pm2 restart vision79-frontend

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
"@ | Out-File -FilePath "deploy.ps1" -Encoding UTF8

Write-Success "Created deploy.ps1"

# Create monitoring script
Write-Status "Creating monitoring script..."

@"
# Vision79 SIWM Monitoring Script for Windows

Write-Host "📊 Vision79 SIWM System Status" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Node.js processes are running
Write-Host "🔍 Process Status:" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "✅ Node.js Process: Running (PID: $($_.Id))" -ForegroundColor Green
}

# Check disk space
Write-Host "`n💾 Disk Usage:" -ForegroundColor Yellow
Get-WmiObject -Class Win32_LogicalDisk | ForEach-Object {
    $freeGB = [math]::Round($_.FreeSpace / 1GB, 2)
    $totalGB = [math]::Round($_.Size / 1GB, 2)
    $usedGB = $totalGB - $freeGB
    $percent = [math]::Round(($usedGB / $totalGB) * 100, 1)
    Write-Host "Drive $($_.DeviceID): $usedGB GB used of $totalGB GB ($percent%)" -ForegroundColor $(if ($percent -gt 80) { "Red" } else { "Green" })
}

# Check memory usage
Write-Host "`n🧠 Memory Usage:" -ForegroundColor Yellow
$memory = Get-WmiObject -Class Win32_OperatingSystem
$totalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
$freeMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
$usedMemory = $totalMemory - $freeMemory
$memoryPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 1)
Write-Host "Memory: $usedMemory GB used of $totalMemory GB ($memoryPercent%)" -ForegroundColor $(if ($memoryPercent -gt 80) { "Red" } else { "Green" })

# Check recent logs
Write-Host "`n📝 Recent Logs:" -ForegroundColor Yellow
if (Test-Path "logs\app.log") {
    Get-Content "logs\app.log" -Tail 5
} else {
    Write-Host "No logs found" -ForegroundColor Yellow
}
"@ | Out-File -FilePath "monitor.ps1" -Encoding UTF8

Write-Success "Created monitor.ps1"

# Final instructions
Write-Host ""
Write-Host "🎉 Vision79 SIWM Production Setup Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in .env.production and backend\.env.production"
Write-Host "2. Configure your domain name in nginx.conf (if using)"
Write-Host "3. Set up SSL certificates for production"
Write-Host "4. Start the services:"
if ($Development) {
    Write-Host "   npm run dev"
} else {
    Write-Host "   npm start"
}
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "- Deploy updates: .\deploy.ps1"
Write-Host "- Monitor system: .\monitor.ps1"
Write-Host "- View logs: Get-Content logs\app.log -Tail 20"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- Production deployment: PRODUCTION_DEPLOYMENT.md"
Write-Host "- Environment setup: ENVIRONMENT_SETUP.md"
Write-Host "- Troubleshooting: TROUBLESHOOTING.md"
Write-Host ""
Write-Host "🔒 Security Checklist:" -ForegroundColor Yellow
Write-Host "✅ Change default passwords"
Write-Host "✅ Update SSL certificates"
Write-Host "✅ Configure firewall rules"
Write-Host "✅ Set up monitoring and alerts"
Write-Host "✅ Regular backups"
Write-Host ""
Write-Host "🚀 Your Vision79 SIWM application is ready for production!" -ForegroundColor Green 