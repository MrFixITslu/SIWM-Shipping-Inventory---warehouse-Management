# Vision79 SIWM - Production Ready Application

A comprehensive, production-ready Shipment Inventory & Warehouse Management (SIWM) system with AI-powered insights, built with modern web technologies and enterprise-grade security.

## 🚀 Production Features

### ✅ **Security & Compliance**
- **JWT Authentication** with secure token management
- **Role-based Access Control** (Admin, Manager, Requester)
- **Input Validation & Sanitization** to prevent XSS and injection attacks
- **Rate Limiting** and brute force protection
- **HTTPS/SSL** enforcement with modern security headers
- **CORS** protection with configurable origins
- **Content Security Policy** (CSP) implementation
- **OWASP Top 10** security compliance

### ✅ **AI Integration**
- **Gemini AI Chatbot** for user assistance
- **AI-Powered Insights** for inventory forecasting
- **Smart Route Optimization** for logistics
- **Automated Delay Prediction** for shipments
- **Natural Language Query** interface for reports

### ✅ **Testing & Quality Assurance**
- **Unit Testing** with Jest (80%+ coverage)
- **Integration Testing** for API endpoints
- **End-to-End Testing** with Cypress
- **Accessibility Testing** with Lighthouse
- **Security Testing** with automated audits
- **Cross-browser Testing** (Chrome, Firefox, Safari, Edge)

### ✅ **Performance & Scalability**
- **Docker Containerization** for consistent deployment
- **Redis Caching** for improved performance
- **Database Connection Pooling** for scalability
- **Lazy Loading** for optimized bundle size
- **CDN Ready** static asset optimization
- **Load Balancing** support

### ✅ **Accessibility (WCAG 2.1 AA)**
- **Screen Reader** compatibility
- **Keyboard Navigation** support
- **High Contrast** mode
- **Reduced Motion** preferences
- **Font Size** controls
- **Focus Management** for modals
- **ARIA Labels** and semantic HTML

### ✅ **Monitoring & Observability**
- **Comprehensive Logging** with Winston
- **Error Tracking** and reporting
- **Health Check** endpoints
- **Performance Monitoring** integration
- **Real-time Alerts** for critical issues

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Redis Cache   │    │   File Storage  │
│   (Reverse Proxy)│   │   (Sessions)    │    │   (Assets)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **React Router** for navigation
- **React Hook Form** for form management
- **Recharts** for data visualization
- **Jest & Testing Library** for testing

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for primary database
- **Redis** for caching and sessions
- **JWT** for authentication
- **Google Gemini AI** for intelligent features
- **Nodemailer** for email notifications
- **Winston** for logging

### DevOps & Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- **GitHub Actions** for CI/CD
- **Nginx** for reverse proxy
- **Let's Encrypt** for SSL certificates

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ 
- **Docker** & Docker Compose
- **PostgreSQL** 15+ (for local development)
- **Redis** 7+ (for local development)

### Required Services
- **Domain name** with DNS access
- **SSL certificate** (Let's Encrypt or commercial)
- **Cloud hosting** (AWS, Azure, GCP, etc.)
- **Monitoring service** (DataDog, New Relic, etc.)
- **Error tracking** (Sentry, LogRocket, etc.)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd vision79-siwm
```

### 2. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit environment variables
# See PRODUCTION_DEPLOYMENT.md for detailed configuration
```

### 4. Database Setup
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
cd backend
npm run migrate:up
cd ..
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:4000
```

## 🧪 Testing

### Run All Tests
```bash
# Frontend tests
npm run test
npm run test:coverage

# Backend tests
cd backend
npm run test
npm run test:coverage

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:accessibility
```

### Security Testing
```bash
# Security audit
npm run test:security

# Fix security issues
npm run security:fix
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Development with Docker
```bash
# Start development environment
docker-compose up -d

# Access services
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
# Database: localhost:5432
# Redis: localhost:6379
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Vision79 SIWM
VITE_APP_VERSION=1.0.0
```

#### Backend (.env)
```env
# Application
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Database
DB_USER=vision79_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vision79_siwm

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Application health
curl http://localhost:4000/api/v1/health

# Database health
curl http://localhost:4000/api/v1/health/db

# Redis health
curl http://localhost:4000/api/v1/health/redis
```

### Logs
```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# View database logs
docker-compose logs -f postgres
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** with granular permissions
- **Session management** with Redis
- **Password hashing** with bcrypt (12 rounds)

### API Security
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **CORS protection** with configurable origins
- **Security headers** (HSTS, CSP, X-Frame-Options)
- **SQL injection protection** with parameterized queries

### Data Protection
- **HTTPS enforcement** in production
- **Data encryption** at rest and in transit
- **Secure cookie settings** with HttpOnly and SameSite
- **CSRF protection** with token validation

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Semantic HTML** structure
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode
- **Reduced motion** preferences
- **Font size** controls

### Accessibility Tools
- **Skip to main content** link
- **Focus management** for modals
- **Live regions** for dynamic content
- **Error announcements** for screen readers

## 🤖 AI Features

### Gemini AI Integration
- **Intelligent Chatbot** for user assistance
- **Inventory Forecasting** with AI insights
- **Route Optimization** for logistics
- **Delay Prediction** for shipments
- **Natural Language Queries** for reports

### AI-Powered Insights
- **Stock-out Risk Analysis**
- **Demand Forecasting**
- **Supplier Performance Analysis**
- **Cost Optimization Suggestions**

## 📈 Performance Optimization

### Frontend Optimization
- **Code splitting** with dynamic imports
- **Lazy loading** for components and routes
- **Bundle optimization** with Vite
- **Image optimization** and compression
- **CDN-ready** static assets

### Backend Optimization
- **Database connection pooling**
- **Redis caching** for frequently accessed data
- **Query optimization** with proper indexing
- **Compression** middleware
- **Load balancing** support

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Code Quality Checks**
   - ESLint and Prettier
   - TypeScript type checking
   - Security audits

2. **Testing**
   - Unit tests with Jest
   - Integration tests
   - E2E tests with Cypress
   - Accessibility tests with Lighthouse

3. **Security**
   - Dependency vulnerability scanning
   - OWASP ZAP security testing
   - Code security analysis

4. **Deployment**
   - Docker image building
   - Container registry push
   - Production deployment

## 📚 Documentation

### Additional Documentation
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Security Guidelines](SECURITY_GUIDELINES.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new features
5. **Run** all tests and linting
6. **Submit** a pull request

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Jest** for testing
- **Conventional commits** for commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the guides in this repository
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

### Contact
- **Email**: support@vision79.com
- **Documentation**: [docs.vision79.com](https://docs.vision79.com)
- **Status Page**: [status.vision79.com](https://status.vision79.com)

---

**Built with ❤️ by the Vision79 Team**

*This application is production-ready and includes enterprise-grade security, performance optimization, comprehensive testing, and accessibility compliance.* 