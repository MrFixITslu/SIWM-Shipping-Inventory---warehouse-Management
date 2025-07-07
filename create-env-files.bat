@echo off
echo Creating Vision79 SIWM Production Environment Files...
echo.

REM Create frontend environment file
echo Creating .env.production...
(
echo # ========================================
echo # VISION79 SIWM - PRODUCTION ENVIRONMENT
echo # ========================================
echo.
echo # Application Configuration
echo VITE_APP_NAME=Vision79 SIWM
echo VITE_APP_VERSION=1.0.0
echo VITE_APP_ENVIRONMENT=production
echo.
echo # API Configuration
echo VITE_API_BASE_URL=https://your-domain.com/api/v1
echo VITE_API_TIMEOUT=30000
echo.
echo # Feature Flags
echo VITE_ENABLE_AI_FEATURES=true
echo VITE_ENABLE_REAL_TIME_UPDATES=true
echo VITE_ENABLE_NOTIFICATIONS=true
echo.
echo # Analytics (Optional)
echo VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
echo VITE_SENTRY_DSN=your-sentry-dsn
echo.
echo # External Services
echo VITE_GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com
echo.
echo # Security
echo VITE_ENABLE_HTTPS=true
echo VITE_ENABLE_CSP=true
echo.
echo # Performance
echo VITE_ENABLE_CACHING=true
echo VITE_ENABLE_COMPRESSION=true
) > .env.production

REM Create backend directory if it doesn't exist
if not exist "backend" mkdir backend

REM Create backend environment file
echo Creating backend\.env.production...
(
echo # ========================================
echo # VISION79 SIWM BACKEND - PRODUCTION ENVIRONMENT
echo # ========================================
echo.
echo # ========================================
echo # APPLICATION CONFIGURATION
echo # ========================================
echo NODE_ENV=production
echo PORT=4000
echo HOST=0.0.0.0
echo APP_NAME=Vision79 SIWM Backend
echo APP_VERSION=1.0.0
echo.
echo # ========================================
echo # SECURITY CONFIGURATION
echo # ========================================
echo # JWT Configuration - CHANGE THESE IN PRODUCTION!
echo JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters-long-and-random
echo JWT_EXPIRES_IN=30d
echo JWT_REFRESH_EXPIRES_IN=7d
echo.
echo # Session Configuration
echo SESSION_SECRET=your-session-secret-key-here-minimum-32-characters
echo SESSION_COOKIE_SECURE=true
echo SESSION_COOKIE_HTTPONLY=true
echo SESSION_COOKIE_SAMESITE=strict
echo.
echo # Password Security
echo BCRYPT_ROUNDS=12
echo PASSWORD_MIN_LENGTH=8
echo PASSWORD_REQUIRE_UPPERCASE=true
echo PASSWORD_REQUIRE_LOWERCASE=true
echo PASSWORD_REQUIRE_NUMBERS=true
echo PASSWORD_REQUIRE_SPECIAL_CHARS=true
echo.
echo # ========================================
echo # DATABASE CONFIGURATION
echo # ========================================
echo DB_USER=vision79_prod_user
echo DB_PASSWORD=your-secure-database-password-here
echo DB_HOST=your-database-host.com
echo DB_PORT=5432
echo DB_NAME=vision79_production
echo DB_SSL=true
echo DB_SSL_REJECT_UNAUTHORIZED=false
echo DB_POOL_MAX=20
echo DB_POOL_MIN=5
echo DB_POOL_IDLE_TIMEOUT=30000
echo DB_POOL_ACQUIRE_TIMEOUT=60000
echo.
echo # ========================================
echo # REDIS CONFIGURATION
echo # ========================================
echo REDIS_URL=redis://your-redis-host.com:6379
echo REDIS_PASSWORD=your-redis-password-here
echo REDIS_DB=0
echo REDIS_MAX_MEMORY=256mb
echo REDIS_MAX_MEMORY_POLICY=allkeys-lru
echo.
echo # ========================================
echo # AI SERVICES CONFIGURATION
echo # ========================================
echo GEMINI_API_KEY=your-gemini-api-key-here
echo GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com
echo GEMINI_MODEL=gemini-2.5-flash-preview-04-17
echo.
echo # ========================================
echo # EMAIL SERVICE CONFIGURATION
echo # ========================================
echo EMAIL_HOST=smtp.gmail.com
echo EMAIL_PORT=587
echo EMAIL_USER=your-email@gmail.com
echo EMAIL_PASS=your-app-password-here
echo EMAIL_FROM_ADDRESS=noreply@yourdomain.com
echo EMAIL_FROM_NAME=Vision79 SIWM Notifications
echo EMAIL_SECURE=true
echo EMAIL_REQUIRE_TLS=true
echo.
echo # ========================================
echo # CORS CONFIGURATION
echo # ========================================
echo ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
echo CORS_CREDENTIALS=true
echo CORS_MAX_AGE=86400
echo.
echo # ========================================
echo # RATE LIMITING CONFIGURATION
echo # ========================================
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=500
echo AUTH_RATE_LIMIT_MAX_REQUESTS=50
echo API_RATE_LIMIT_MAX_REQUESTS=1000
echo.
echo # ========================================
echo # LOGGING CONFIGURATION
echo # ========================================
echo LOG_LEVEL=info
echo LOG_FILE_PATH=/var/log/vision79/app.log
echo LOG_MAX_SIZE=20m
echo LOG_MAX_FILES=14d
echo LOG_FORMAT=json
echo.
echo # ========================================
echo # MONITORING CONFIGURATION
echo # ========================================
echo SENTRY_DSN=your-sentry-dsn-here
echo NEW_RELIC_LICENSE_KEY=your-new-relic-key-here
echo NEW_RELIC_APP_NAME=Vision79 SIWM Backend
echo.
echo # ========================================
echo # FILE UPLOAD CONFIGURATION
echo # ========================================
echo UPLOAD_MAX_SIZE=10485760
echo UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
echo UPLOAD_PATH=/uploads
echo.
echo # ========================================
echo # CACHE CONFIGURATION
echo # ========================================
echo CACHE_TTL=3600
echo CACHE_MAX_SIZE=100
echo CACHE_ENABLED=true
echo.
echo # ========================================
echo # PERFORMANCE CONFIGURATION
echo # ========================================
echo COMPRESSION_ENABLED=true
echo COMPRESSION_LEVEL=6
echo COMPRESSION_THRESHOLD=1024
echo.
echo # ========================================
echo # SECURITY HEADERS
echo # ========================================
echo SECURITY_HEADERS_ENABLED=true
echo CSP_ENABLED=true
echo HSTS_ENABLED=true
echo HSTS_MAX_AGE=31536000
echo HSTS_INCLUDE_SUBDOMAINS=true
echo HSTS_PRELOAD=true
echo.
echo # ========================================
echo # BACKUP CONFIGURATION
echo # ========================================
echo BACKUP_ENABLED=true
echo BACKUP_SCHEDULE=0 2 * * *
echo BACKUP_RETENTION_DAYS=7
echo BACKUP_PATH=/backups
echo.
echo # ========================================
echo # HEALTH CHECK CONFIGURATION
echo # ========================================
echo HEALTH_CHECK_ENABLED=true
echo HEALTH_CHECK_INTERVAL=30000
echo HEALTH_CHECK_TIMEOUT=5000
echo.
echo # ========================================
echo # DEVELOPMENT OVERRIDES (DISABLE IN PRODUCTION)
echo # ========================================
echo # Set to false in production
echo ALLOW_PUBLIC_IP=false
echo DEBUG_MODE=false
echo VERBOSE_LOGGING=false
) > backend\.env.production

REM Update .gitignore
echo Updating .gitignore...
if not exist ".gitignore" (
    echo # Production environment files > .gitignore
    echo .env.production >> .gitignore
    echo backend\.env.production >> .gitignore
) else (
    echo. >> .gitignore
    echo # Production environment files >> .gitignore
    echo .env.production >> .gitignore
    echo backend\.env.production >> .gitignore
)

echo.
echo ✅ Environment files created successfully!
echo.
echo 📋 Next steps:
echo 1. Edit .env.production and backend\.env.production with your actual values
echo 2. Update domain references (replace 'your-domain.com' with your actual domain)
echo 3. Configure your database and Redis connections
echo 4. Set up your Gemini AI API key
echo 5. Configure email service credentials
echo 6. Set up monitoring services (optional)
echo.
echo ⚠️  IMPORTANT: Never commit .env.production files to version control!
echo.
echo 📖 For detailed configuration instructions, see ENVIRONMENT_SETUP.md
echo.
echo 🔍 Run the validation script to test your configuration:
echo node validate-env.js 