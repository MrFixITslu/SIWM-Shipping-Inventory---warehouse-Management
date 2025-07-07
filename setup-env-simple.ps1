# Vision79 SIWM Environment Setup Script (PowerShell)
# Simple version without complex syntax

Write-Host "🚀 Vision79 SIWM Environment Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Check requirements
Write-Host "ℹ️  Checking requirements..." -ForegroundColor Blue

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All requirements are met" -ForegroundColor Green

# Generate secrets
Write-Host "ℹ️  Generating secure secrets..." -ForegroundColor Blue

$JWT_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$SESSION_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$DB_PASSWORD = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
$REDIS_PASSWORD = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))

Write-Host "✅ Generated secure secrets" -ForegroundColor Green

# Create frontend environment file
Write-Host "ℹ️  Creating frontend environment file..." -ForegroundColor Blue

$frontendContent = @"
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

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your-sentry-dsn

# External Services
VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com

# Security
VITE_ENABLE_HTTPS=true
VITE_ENABLE_CSP=true

# Performance
VITE_ENABLE_CACHING=true
VITE_ENABLE_COMPRESSION=true
"@

$frontendContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "✅ Created .env.production" -ForegroundColor Green

# Create backend environment file
Write-Host "ℹ️  Creating backend environment file..." -ForegroundColor Blue

# Ensure backend directory exists
if (!(Test-Path "backend")) {
    New-Item -ItemType Directory -Path "backend" | Out-Null
}

$backendContent = @"
# ========================================
# VISION79 SIWM BACKEND - PRODUCTION ENVIRONMENT
# ========================================

# ========================================
# APPLICATION CONFIGURATION
# ========================================
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
APP_NAME=Vision79 SIWM Backend
APP_VERSION=1.0.0

# ========================================
# SECURITY CONFIGURATION
# ========================================
# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=$SESSION_SECRET
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict

# Password Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_USER=vision79_prod_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=vision79_production
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# ========================================
# REDIS CONFIGURATION
# ========================================
REDIS_URL=redis://your-redis-host.com:6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_DB=0
REDIS_MAX_MEMORY=256mb
REDIS_MAX_MEMORY_POLICY=allkeys-lru

# ========================================
# AI SERVICES CONFIGURATION
# ========================================
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash-preview-04-17

# ========================================
# EMAIL SERVICE CONFIGURATION
# ========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Vision79 SIWM Notifications
EMAIL_SECURE=true
EMAIL_REQUIRE_TLS=true

# ========================================
# CORS CONFIGURATION
# ========================================
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400

# ========================================
# RATE LIMITING CONFIGURATION
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX_REQUESTS=50
API_RATE_LIMIT_MAX_REQUESTS=1000

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/vision79/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
LOG_FORMAT=json

# ========================================
# MONITORING CONFIGURATION
# ========================================
SENTRY_DSN=your-sentry-dsn-here
NEW_RELIC_LICENSE_KEY=your-new-relic-key-here
NEW_RELIC_APP_NAME=Vision79 SIWM Backend

# ========================================
# FILE UPLOAD CONFIGURATION
# ========================================
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_PATH=/uploads

# ========================================
# CACHE CONFIGURATION
# ========================================
CACHE_TTL=3600
CACHE_MAX_SIZE=100
CACHE_ENABLED=true

# ========================================
# PERFORMANCE CONFIGURATION
# ========================================
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024

# ========================================
# SECURITY HEADERS
# ========================================
SECURITY_HEADERS_ENABLED=true
CSP_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# ========================================
# BACKUP CONFIGURATION
# ========================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=7
BACKUP_PATH=/backups

# ========================================
# HEALTH CHECK CONFIGURATION
# ========================================
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# ========================================
# DEVELOPMENT OVERRIDES (DISABLE IN PRODUCTION)
# ========================================
# Set to false in production
ALLOW_PUBLIC_IP=false
DEBUG_MODE=false
VERBOSE_LOGGING=false
"@

$backendContent | Out-File -FilePath "backend\.env.production" -Encoding UTF8
Write-Host "✅ Created backend\.env.production" -ForegroundColor Green

# Update .gitignore
Write-Host "ℹ️  Updating .gitignore..." -ForegroundColor Blue

if (!(Test-Path ".gitignore")) {
    New-Item -ItemType File -Path ".gitignore" | Out-Null
}

$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue

if ($gitignoreContent -notcontains "# Production environment files") {
    Add-Content ".gitignore" ""
    Add-Content ".gitignore" "# Production environment files"
    Add-Content ".gitignore" ".env.production"
    Add-Content ".gitignore" "backend\.env.production"
}

Write-Host "✅ Added environment files to .gitignore" -ForegroundColor Green

# Display next steps
Write-Host ""
Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Next steps:" -ForegroundColor Blue
Write-Host "1. Edit .env.production and backend\.env.production with your actual values"
Write-Host "2. Update domain references (replace 'your-domain.com' with your actual domain)"
Write-Host "3. Configure your database and Redis connections"
Write-Host "4. Set up your Gemini AI API key"
Write-Host "5. Configure email service credentials"
Write-Host "6. Set up monitoring services (optional)"
Write-Host ""
Write-Host "⚠️  IMPORTANT: Never commit .env.production files to version control!" -ForegroundColor Yellow
Write-Host ""
Write-Host "ℹ️  For detailed configuration instructions, see ENVIRONMENT_SETUP.md" -ForegroundColor Blue
Write-Host ""
Write-Host "ℹ️  Run the validation script to test your configuration:" -ForegroundColor Blue
Write-Host "node validate-env.js" 