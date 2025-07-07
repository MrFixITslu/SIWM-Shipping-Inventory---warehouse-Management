# Production Deployment Guide

This guide provides comprehensive instructions for deploying the Vision79 SIWM application to production with security, performance, and monitoring best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [SSL/HTTPS Configuration](#sslhttps-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Performance Optimization](#performance-optimization)
10. [Backup & Recovery](#backup--recovery)
11. [Security Hardening](#security-hardening)
12. [Testing Checklist](#testing-checklist)

## Prerequisites

### Required Software
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+
- Nginx (for reverse proxy)

### Required Services
- Domain name with DNS access
- SSL certificate (Let's Encrypt or commercial)
- Cloud hosting provider (AWS, Azure, GCP, etc.)
- Monitoring service (DataDog, New Relic, etc.)
- Error tracking service (Sentry, LogRocket, etc.)

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file:

```env
# Application
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
SESSION_SECRET=your-session-secret-key-here
BCRYPT_ROUNDS=12

# Database
DB_USER=vision79_prod_user
DB_PASSWORD=your-secure-database-password
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=vision79_production
DB_SSL=true

# Redis
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-redis-password

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME="Vision79 SIWM"

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/vision79/app.log

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

### 2. Database Setup

#### PostgreSQL Production Configuration

```sql
-- Create production database
CREATE DATABASE vision79_production;

-- Create production user with limited privileges
CREATE USER vision79_prod_user WITH PASSWORD 'your-secure-password';

-- Grant necessary privileges
GRANT CONNECT ON DATABASE vision79_production TO vision79_prod_user;
GRANT USAGE ON SCHEMA public TO vision79_prod_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vision79_prod_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vision79_prod_user;

-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL';
```

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

## Security Configuration

### 1. SSL/TLS Configuration

#### Nginx SSL Configuration

```nginx
# /etc/nginx/sites-available/vision79
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    }
}
```

### 2. Firewall Configuration

```bash
# UFW Firewall Configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Docker Deployment

### 1. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - JWT_SECRET=${JWT_SECRET}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/create_system_settings_table.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 2. Deployment Commands

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER $DB_NAME > backup.sql
```

## Cloud Deployment

### AWS Deployment Example

#### 1. ECS Task Definition

```json
{
  "family": "vision79-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/vision79-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vision79-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2. Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name vision79-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678

# Create target group
aws elbv2 create-target-group \
  --name vision79-tg \
  --protocol HTTP \
  --port 4000 \
  --vpc-id vpc-12345678 \
  --target-type ip \
  --health-check-path /api/v1/health
```

## Monitoring & Logging

### 1. Application Monitoring

#### Winston Logger Configuration

```javascript
// backend/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vision79-backend' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. Health Check Endpoint

```javascript
// backend/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection
    const redis = require('redis');
    const client = redis.createClient(process.env.REDIS_URL);
    await client.ping();
    client.quit();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

## Performance Optimization

### 1. Frontend Optimization

#### Vite Production Configuration

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  }
});
```

### 2. Backend Optimization

#### Database Connection Pooling

```javascript
// backend/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500 // Close (and replace) a connection after it has been used 7500 times
});

module.exports = { pool };
```

## Backup & Recovery

### 1. Database Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="vision79_production"
DB_USER="vision79_prod_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 2. Automated Backup with Cron

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## Security Hardening

### 1. Security Headers

```javascript
// backend/middleware/securityMiddleware.js
const helmet = require('helmet');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});
```

### 2. Input Validation

```javascript
// backend/middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z\s]+$/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## Testing Checklist

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Accessibility testing completed
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error tracking configured
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Input validation implemented
- [ ] Logging configured
- [ ] Health checks implemented

### Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] All API endpoints responding
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Email service working
- [ ] AI features working
- [ ] File uploads working
- [ ] User authentication working
- [ ] Role-based access working
- [ ] Real-time updates working
- [ ] Reports generating correctly
- [ ] Error pages displaying correctly
- [ ] Performance monitoring active
- [ ] Logs being generated
- [ ] Backups running successfully

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check database credentials
   - Verify network connectivity
   - Check SSL configuration

2. **CORS Errors**
   - Verify ALLOWED_ORIGINS configuration
   - Check frontend URL in backend CORS settings

3. **SSL Certificate Issues**
   - Verify certificate installation
   - Check certificate expiration
   - Validate certificate chain

4. **Performance Issues**
   - Check database query performance
   - Monitor memory usage
   - Review caching configuration

### Monitoring Commands

```bash
# Check application status
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check database connections
docker-compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor system resources
htop
df -h
free -h
```

This deployment guide ensures your Vision79 SIWM application is production-ready with enterprise-grade security, performance, and monitoring capabilities. 