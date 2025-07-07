#!/bin/bash

# Vision79 SIWM Environment Setup Script
# This script helps you set up production environment variables

set -e

echo "🚀 Vision79 SIWM Environment Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All requirements are met"
}

# Generate secure secrets
generate_secrets() {
    print_info "Generating secure secrets..."
    
    # Generate JWT Secret
    JWT_SECRET=$(openssl rand -base64 32)
    print_status "Generated JWT_SECRET"
    
    # Generate Session Secret
    SESSION_SECRET=$(openssl rand -base64 32)
    print_status "Generated SESSION_SECRET"
    
    # Generate Database Password
    DB_PASSWORD=$(openssl rand -base64 16)
    print_status "Generated DB_PASSWORD"
    
    # Generate Redis Password
    REDIS_PASSWORD=$(openssl rand -base64 16)
    print_status "Generated REDIS_PASSWORD"
}

# Create frontend environment file
create_frontend_env() {
    print_info "Creating frontend environment file..."
    
    cat > .env.production << EOF
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
EOF

    print_status "Created .env.production"
}

# Create backend environment file
create_backend_env() {
    print_info "Creating backend environment file..."
    
    cat > backend/.env.production << EOF
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
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}
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
DB_PASSWORD=${DB_PASSWORD}
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
REDIS_PASSWORD=${REDIS_PASSWORD}
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
EMAIL_FROM_NAME="Vision79 SIWM Notifications"
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
EOF

    print_status "Created backend/.env.production"
}

# Validate environment files
validate_env_files() {
    print_info "Validating environment files..."
    
    # Check if files exist
    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found"
        exit 1
    fi
    
    if [ ! -f "backend/.env.production" ]; then
        print_error "backend/.env.production not found"
        exit 1
    fi
    
    # Check JWT secret strength
    JWT_SECRET_LENGTH=$(grep "JWT_SECRET=" backend/.env.production | cut -d'=' -f2 | wc -c)
    if [ "$JWT_SECRET_LENGTH" -lt 32 ]; then
        print_warning "JWT_SECRET might be too weak"
    else
        print_status "JWT_SECRET is secure"
    fi
    
    print_status "Environment files are valid"
}

# Create .gitignore entries
update_gitignore() {
    print_info "Updating .gitignore..."
    
    # Check if .gitignore exists
    if [ ! -f ".gitignore" ]; then
        print_warning ".gitignore not found, creating one..."
        touch .gitignore
    fi
    
    # Add environment files to .gitignore if not already present
    if ! grep -q ".env.production" .gitignore; then
        echo "" >> .gitignore
        echo "# Production environment files" >> .gitignore
        echo ".env.production" >> .gitignore
        echo "backend/.env.production" >> .gitignore
        print_status "Added environment files to .gitignore"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Environment setup complete!"
    echo "=============================="
    echo ""
    print_info "Next steps:"
    echo "1. Edit .env.production and backend/.env.production with your actual values"
    echo "2. Update domain references (replace 'your-domain.com' with your actual domain)"
    echo "3. Configure your database and Redis connections"
    echo "4. Set up your Gemini AI API key"
    echo "5. Configure email service credentials"
    echo "6. Set up monitoring services (optional)"
    echo ""
    print_warning "IMPORTANT: Never commit .env.production files to version control!"
    echo ""
    print_info "For detailed configuration instructions, see ENVIRONMENT_SETUP.md"
}

# Main execution
main() {
    check_requirements
    generate_secrets
    create_frontend_env
    create_backend_env
    validate_env_files
    update_gitignore
    show_next_steps
}

# Run main function
main "$@" 