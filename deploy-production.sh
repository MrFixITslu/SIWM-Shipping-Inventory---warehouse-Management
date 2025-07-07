#!/bin/bash

# Vision79 SIWM Production Deployment Script
# This script sets up the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting Vision79 SIWM Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm version: $(npm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not work."
else
    print_success "Docker version: $(docker --version)"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Some features may not work."
else
    print_success "Docker Compose version: $(docker-compose --version)"
fi

# Create production environment files
print_status "Setting up environment files..."

# Frontend production environment
if [ ! -f .env.production ]; then
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

# Security
VITE_ENABLE_HTTPS=true
VITE_ENABLE_CSP=true

# Performance
VITE_ENABLE_CACHING=true
VITE_ENABLE_COMPRESSION=true
EOF
    print_success "Created .env.production"
else
    print_warning ".env.production already exists"
fi

# Backend production environment
if [ ! -f backend/.env.production ]; then
    cat > backend/.env.production << EOF
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
DB_SSL=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password-here

# AI Services Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX_REQUESTS=50

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/vision79/app.log

# Performance Configuration
COMPRESSION_ENABLED=true
CACHE_ENABLED=true
EOF
    print_success "Created backend/.env.production"
else
    print_warning "backend/.env.production already exists"
fi

# Install dependencies
print_status "Installing dependencies..."

# Frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

print_success "Dependencies installed successfully"

# Generate secrets
print_status "Generating application secrets..."
npm run generate-secrets

# Build the application
print_status "Building the application for production..."

# Build frontend
print_status "Building frontend..."
npm run build

# Build backend (if needed)
print_status "Building backend..."
cd backend
npm run build:prod
cd ..

print_success "Application built successfully"

# Create production Docker Compose file
print_status "Creating production Docker Compose configuration..."

cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: vision79_postgres
    environment:
      POSTGRES_DB: vision79_production
      POSTGRES_USER: vision79_prod_user
      POSTGRES_PASSWORD: your-secure-database-password-here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/create_system_settings_table.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - vision79_network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: vision79_redis
    command: redis-server --requirepass your-redis-password-here
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - vision79_network
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vision79_backend
    environment:
      - NODE_ENV=production
      - PORT=4000
    env_file:
      - ./backend/.env.production
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    networks:
      - vision79_network
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/vision79

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: vision79_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./dist:/usr/share/nginx/html
    depends_on:
      - backend
    networks:
      - vision79_network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  vision79_network:
    driver: bridge
EOF

print_success "Created docker-compose.prod.yml"

# Create Nginx configuration
print_status "Creating Nginx configuration..."

cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream backend
    upstream backend {
        server backend:4000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            try_files \$uri \$uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

print_success "Created nginx.conf"

# Create SSL directory and generate self-signed certificate for testing
print_status "Setting up SSL certificates..."

mkdir -p ssl

# Generate self-signed certificate for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

print_success "SSL certificates generated"

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Create systemd service files
print_status "Creating systemd service files..."

cat > vision79-backend.service << EOF
[Unit]
Description=Vision79 SIWM Backend
After=network.target

[Service]
Type=simple
User=vision79
WorkingDirectory=/opt/vision79/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
EOF

cat > vision79-frontend.service << EOF
[Unit]
Description=Vision79 SIWM Frontend
After=network.target

[Service]
Type=simple
User=vision79
WorkingDirectory=/opt/vision79
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

print_success "Created systemd service files"

# Create deployment script
print_status "Creating deployment script..."

cat > deploy.sh << 'EOF'
#!/bin/bash

# Vision79 SIWM Deployment Script

set -e

echo "🚀 Deploying Vision79 SIWM..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd backend && npm install && cd ..

# Build application
npm run build:prod

# Restart services
sudo systemctl restart vision79-backend
sudo systemctl restart vision79-frontend

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
EOF

chmod +x deploy.sh

print_success "Created deploy.sh"

# Create backup script
print_status "Creating backup script..."

cat > backup.sh << 'EOF'
#!/bin/bash

# Vision79 SIWM Backup Script

set -e

BACKUP_DIR="/opt/backups/vision79"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📦 Creating backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec vision79_postgres pg_dump -U vision79_prod_user vision79_production > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    .

# Backup logs
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz logs/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh

print_success "Created backup.sh"

# Create monitoring script
print_status "Creating monitoring script..."

cat > monitor.sh << 'EOF'
#!/bin/bash

# Vision79 SIWM Monitoring Script

echo "📊 Vision79 SIWM System Status"
echo "================================"

# Check if services are running
echo "🔍 Service Status:"
if systemctl is-active --quiet vision79-backend; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Stopped"
fi

if systemctl is-active --quiet vision79-frontend; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Stopped"
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Stopped"
fi

# Check database connection
echo ""
echo "🗄️ Database Status:"
if docker exec vision79_postgres pg_isready -U vision79_prod_user; then
    echo "✅ PostgreSQL: Connected"
else
    echo "❌ PostgreSQL: Connection failed"
fi

# Check Redis connection
echo ""
echo "🔴 Redis Status:"
if docker exec vision79_redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis: Connected"
else
    echo "❌ Redis: Connection failed"
fi

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h | grep -E "Filesystem|/$"

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h

# Check recent logs
echo ""
echo "📝 Recent Logs:"
tail -n 5 logs/app.log 2>/dev/null || echo "No logs found"
EOF

chmod +x monitor.sh

print_success "Created monitor.sh"

# Final instructions
echo ""
echo "🎉 Vision79 SIWM Production Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo "1. Update environment variables in .env.production and backend/.env.production"
echo "2. Configure your domain name in nginx.conf"
echo "3. Set up SSL certificates for production"
echo "4. Start the services:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🔧 Useful Commands:"
echo "- Deploy updates: ./deploy.sh"
echo "- Create backup: ./backup.sh"
echo "- Monitor system: ./monitor.sh"
echo "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "📚 Documentation:"
echo "- Production deployment: PRODUCTION_DEPLOYMENT.md"
echo "- Environment setup: ENVIRONMENT_SETUP.md"
echo "- Troubleshooting: TROUBLESHOOTING.md"
echo ""
echo "🔒 Security Checklist:"
echo "✅ Change default passwords"
echo "✅ Update SSL certificates"
echo "✅ Configure firewall rules"
echo "✅ Set up monitoring and alerts"
echo "✅ Regular backups"
echo ""
echo "🚀 Your Vision79 SIWM application is ready for production!" 