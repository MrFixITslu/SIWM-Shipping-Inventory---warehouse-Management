# Vision79 SIWM Environment Setup Script (PowerShell)
# This script helps you set up production environment variables

param(
    [switch]$SkipValidation
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Vision79 SIWM Environment Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if required tools are installed
function Test-Requirements {
    Write-Info "Checking requirements..."
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-Status "Node.js is installed: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install it first."
        exit 1
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-Status "npm is installed: $npmVersion"
    }
    catch {
        Write-Error "npm is not installed. Please install it first."
        exit 1
    }
    
    Write-Status "All requirements are met"
}

# Generate secure secrets
function New-Secrets {
    Write-Info "Generating secure secrets..."
    
    # Generate JWT Secret (32+ characters)
    $JWT_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Status "Generated JWT_SECRET"
    
    # Generate Session Secret
    $SESSION_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Status "Generated SESSION_SECRET"
    
    # Generate Database Password
    $DB_PASSWORD = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
    Write-Status "Generated DB_PASSWORD"
    
    # Generate Redis Password
    $REDIS_PASSWORD = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
    Write-Status "Generated REDIS_PASSWORD"
    
    return @{
        JWT_SECRET = $JWT_SECRET
        SESSION_SECRET = $SESSION_SECRET
        DB_PASSWORD = $DB_PASSWORD
        REDIS_PASSWORD = $REDIS_PASSWORD
    }
}

# Create frontend environment file
function New-FrontendEnv {
    Write-Info "Creating frontend environment file..."
    
    $frontendEnv = @"
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

    $frontendEnv | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Status "Created .env.production"
}

# Create backend environment file
function New-BackendEnv {
    param($Secrets)
    
    Write-Info "Creating backend environment file..."
    
    $backendEnv = @"
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
JWT_SECRET=$($Secrets.JWT_SECRET)
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=$($Secrets.SESSION_SECRET)
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
DB_PASSWORD=$($Secrets.DB_PASSWORD)
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
REDIS_PASSWORD=$($Secrets.REDIS_PASSWORD)
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

    # Ensure backend directory exists
    if (!(Test-Path "backend")) {
        New-Item -ItemType Directory -Path "backend" | Out-Null
    }
    
    $backendEnv | Out-File -FilePath "backend\.env.production" -Encoding UTF8
    Write-Status "Created backend\.env.production"
}

# Validate environment files
function Test-EnvFiles {
    Write-Info "Validating environment files..."
    
    # Check if files exist
    if (!(Test-Path ".env.production")) {
        Write-Error ".env.production not found"
        return $false
    }
    
    if (!(Test-Path "backend\.env.production")) {
        Write-Error "backend\.env.production not found"
        return $false
    }
    
    # Check JWT secret strength
    $backendEnv = Get-Content "backend\.env.production" | Where-Object { $_ -match "^JWT_SECRET=" }
    if ($backendEnv) {
        $jwtSecret = $backendEnv -replace "^JWT_SECRET=", ""
        if ($jwtSecret.Length -lt 32) {
            Write-Warning "JWT_SECRET might be too weak"
        } else {
            Write-Status "JWT_SECRET is secure"
        }
    }
    
    Write-Status "Environment files are valid"
    return $true
}

# Update .gitignore
function Update-Gitignore {
    Write-Info "Updating .gitignore..."
    
    # Check if .gitignore exists
    if (!(Test-Path ".gitignore")) {
        Write-Warning ".gitignore not found, creating one..."
        New-Item -ItemType File -Path ".gitignore" | Out-Null
    }
    
    # Add environment files to .gitignore if not already present
    $gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    $envFiles = @("# Production environment files", ".env.production", "backend\.env.production")
    
    foreach ($line in $envFiles) {
        if ($gitignoreContent -notcontains $line) {
            Add-Content ".gitignore" $line
        }
    }
    
    Write-Status "Added environment files to .gitignore"
}

# Display next steps
function Show-NextSteps {
    Write-Host ""
    Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
    Write-Host "==============================" -ForegroundColor Green
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "1. Edit .env.production and backend\.env.production with your actual values"
    Write-Host "2. Update domain references (replace 'your-domain.com' with your actual domain)"
    Write-Host "3. Configure your database and Redis connections"
    Write-Host "4. Set up your Gemini AI API key"
    Write-Host "5. Configure email service credentials"
    Write-Host "6. Set up monitoring services (optional)"
    Write-Host ""
    Write-Warning "IMPORTANT: Never commit .env.production files to version control!"
    Write-Host ""
    Write-Info "For detailed configuration instructions, see ENVIRONMENT_SETUP.md"
    
    if (!$SkipValidation) {
        Write-Host ""
        Write-Info "Run the validation script to test your configuration:"
        Write-Host "node validate-env.js"
    }
}

# Main execution
function Main {
    Test-Requirements
    $secrets = New-Secrets
    New-FrontendEnv
    New-BackendEnv -Secrets $secrets
    Test-EnvFiles
    Update-Gitignore
    Show-NextSteps
}

# Run main function
Main 