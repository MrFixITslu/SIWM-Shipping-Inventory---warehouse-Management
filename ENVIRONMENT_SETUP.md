# Environment Configuration Guide

This guide will walk you through setting up production environment variables for the Vision79 SIWM application.

## 📁 File Structure

Create these environment files in your project:

```
vision79-siwm/
├── .env.production          # Frontend production variables
├── backend/
│   └── .env.production      # Backend production variables
└── .env.example             # Example template
```

## 🔧 Step-by-Step Configuration

### Step 1: Create Frontend Production Environment

Create `.env.production` in the root directory:

```env
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
```

### Step 2: Create Backend Production Environment

Create `backend/.env.production`:

```env
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
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters-long-and-random
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret-key-here-minimum-32-characters
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
DB_PASSWORD=your-secure-database-password-here
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
REDIS_PASSWORD=your-redis-password-here
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
```

## 🔐 Security Configuration

### Step 3: Generate Secure Secrets

**⚠️ CRITICAL: Never use these example values in production!**

Generate secure secrets using these commands:

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 16

# Generate Redis Password
openssl rand -base64 16
```

### Step 4: Configure Database

#### PostgreSQL Production Setup

```sql
-- Create production database
CREATE DATABASE vision79_production;

-- Create production user with limited privileges
CREATE USER vision79_prod_user WITH PASSWORD 'your-secure-database-password';

-- Grant necessary privileges
GRANT CONNECT ON DATABASE vision79_production TO vision79_prod_user;
GRANT USAGE ON SCHEMA public TO vision79_prod_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vision79_prod_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vision79_prod_user;

-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL';
```

### Step 5: Configure Redis

#### Redis Production Configuration

```redis
# redis.conf
bind 127.0.0.1
port 6379
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🌐 Domain Configuration

### Step 6: Update Domain References

Replace `your-domain.com` with your actual domain:

```env
# Frontend
VITE_API_BASE_URL=https://yourdomain.com/api/v1

# Backend
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## 🔑 API Keys Setup

### Step 7: Configure External Services

#### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `GEMINI_API_KEY`

#### Email Service (Gmail Example)
1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → App Passwords
   - Select "Mail" and "Other"
   - Use the generated 16-character password

#### Monitoring Services (Optional)
- **Sentry**: Get DSN from [sentry.io](https://sentry.io)
- **New Relic**: Get license key from [newrelic.com](https://newrelic.com)

## 🚀 Deployment Configuration

### Step 8: Docker Environment

For Docker deployment, create `.env` files:

```bash
# Copy production environment for Docker
cp .env.production .env
cp backend/.env.production backend/.env
```

### Step 9: Cloud Platform Configuration

#### AWS Example
```bash
# Set environment variables in AWS ECS
aws ecs register-task-definition \
  --family vision79-backend \
  --container-definitions '[
    {
      "name": "backend",
      "image": "your-registry/vision79-backend:latest",
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DB_HOST", "value": "your-rds-endpoint"}
      ],
      "secrets": [
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"}
      ]
    }
  ]'
```

## ✅ Validation Checklist

### Environment Variables Validation

```bash
# Test environment loading
node -e "
require('dotenv').config({ path: '.env.production' });
console.log('Environment loaded successfully');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
"

# Test database connection
cd backend
npm run test:db-connection
```

### Security Validation

```bash
# Check for common security issues
npm run security:audit

# Validate JWT secret strength
node -e "
const crypto = require('crypto');
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  console.error('❌ JWT_SECRET is too weak');
  process.exit(1);
}
console.log('✅ JWT_SECRET is secure');
"
```

## 🔍 Environment Variable Categories

### Required (Must Set)
- `NODE_ENV=production`
- `JWT_SECRET` (32+ characters)
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`
- `REDIS_URL`, `REDIS_PASSWORD`

### Recommended (Production Best Practices)
- `SESSION_SECRET`
- `GEMINI_API_KEY`
- `EMAIL_*` configuration
- `ALLOWED_ORIGINS`
- `SENTRY_DSN`

### Optional (Enhanced Features)
- `NEW_RELIC_LICENSE_KEY`
- `GOOGLE_ANALYTICS_ID`
- `BACKUP_*` configuration
- `HEALTH_CHECK_*` configuration

## 🛡️ Security Best Practices

### 1. Secret Management
- ✅ Use strong, random secrets (32+ characters)
- ✅ Store secrets in environment variables, not code
- ✅ Use different secrets for each environment
- ✅ Rotate secrets regularly

### 2. Database Security
- ✅ Use SSL connections
- ✅ Limit database user privileges
- ✅ Use strong passwords
- ✅ Enable connection pooling

### 3. Network Security
- ✅ Use HTTPS in production
- ✅ Configure CORS properly
- ✅ Enable rate limiting
- ✅ Use security headers

### 4. Monitoring
- ✅ Enable logging
- ✅ Set up error tracking
- ✅ Monitor performance
- ✅ Set up alerts

## 🚨 Common Issues & Solutions

### Issue: Environment variables not loading
```bash
# Solution: Check file location and format
ls -la .env.production
cat .env.production | head -5
```

### Issue: Database connection fails
```bash
# Solution: Test connection manually
psql -h your-db-host -U your-db-user -d your-db-name
```

### Issue: Redis connection fails
```bash
# Solution: Test Redis connection
redis-cli -h your-redis-host -a your-redis-password ping
```

### Issue: JWT authentication fails
```bash
# Solution: Verify JWT secret is set
echo $JWT_SECRET | wc -c  # Should be > 32
```

## 📞 Support

If you encounter issues with environment configuration:

1. **Check the logs**: `docker-compose logs backend`
2. **Validate syntax**: Ensure no spaces around `=`
3. **Test connections**: Use the validation scripts above
4. **Review security**: Ensure all secrets are properly set

Remember: **Never commit `.env.production` files to version control!** Add them to `.gitignore`. 