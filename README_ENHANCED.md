# Vision79 SIWM - Enhanced Logistics Management System

A comprehensive, secure, and scalable web application for shipping, procurement, and logistics management with advanced AI-powered optimization features.

## 🌟 Key Features

### 🤖 AI-Powered Optimization
- **Gemini AI Integration**: Advanced AI chatbot and optimization engine
- **Shipping Route Optimization**: AI-powered route planning with constraints
- **Inventory Forecasting**: Predictive analytics for stock management
- **Supplier Performance Analysis**: AI-driven supplier evaluation
- **Warehouse Layout Optimization**: Intelligent space utilization
- **Procurement Insights**: Market trend analysis and cost optimization

### 📦 Core Logistics Features
- **Incoming Shipments**: ASN processing and ETA tracking
- **Inventory Management**: Real-time stock levels and smart intake
- **Warehouse Orders**: Order processing and fulfillment
- **Dispatch & Logistics**: Route planning and delivery management
- **Vendor Management**: Supplier relationship management
- **Asset Management**: Equipment and resource tracking

### 🔒 Security & Compliance
- **JWT Authentication**: Secure user authentication
- **Role-based Access Control**: Granular permissions
- **HTTPS/SSL**: Encrypted data transmission
- **Input Validation**: XSS and SQL injection protection
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Comprehensive activity tracking

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Live metrics and KPIs
- **Advanced Reporting**: Custom report generation
- **Data Export**: PDF and CSV export capabilities
- **Performance Monitoring**: System health tracking

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for responsive design
- **Vite** for fast development and building
- **React Router** for navigation
- **Heroicons** for UI icons

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **Redis** for caching and sessions
- **JWT** for authentication
- **Google Gemini AI** for intelligent features

### DevOps & Security
- **Docker** for containerization
- **Nginx** for reverse proxy
- **Helmet.js** for security headers
- **Rate limiting** and CORS protection
- **Comprehensive testing** with Jest, Cypress, and Playwright

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Google Gemini AI API Key

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Inventoryapp
```

### 2. Environment Setup
```bash
# Create environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Generate secrets
npm run generate-secrets
```

### 3. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install
```

### 4. Database Setup
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
cd backend && npm run migrate:up
```

### 5. Configure AI Services
Add your Gemini AI API key to `backend/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 6. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on port 5173
npm run dev:backend   # Backend on port 4000
```

## 🎯 AI-Powered Features

### 1. Intelligent Chatbot (VisionBot)
- Context-aware assistance for logistics operations
- Real-time streaming responses
- Session persistence across browser sessions
- PDF document processing for serial number extraction

### 2. Shipping Route Optimization
```javascript
// Example API call
const optimization = await logisticsService.optimizeShippingRoute(
  "New York, NY",
  "Los Angeles, CA",
  { maxCost: 5000, timeLimit: "48h", preferredCarrier: "FedEx" }
);
```

### 3. Inventory Forecasting
- Historical data analysis
- Seasonal trend prediction
- Reorder point optimization
- Risk assessment for stockouts

### 4. Supplier Performance Analysis
- On-time delivery tracking
- Quality rating assessment
- Cost effectiveness analysis
- Risk mitigation recommendations

### 5. Warehouse Layout Optimization
- Space utilization analysis
- Pick path optimization
- Efficiency improvement suggestions
- Order pattern analysis

### 6. Procurement Insights
- Market trend analysis
- Cost optimization strategies
- Supplier recommendations
- Negotiation point identification

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh

### AI Services
- `POST /api/v1/gemini/chat/stream` - AI chatbot
- `POST /api/v1/gemini/extract-from-pdf` - PDF processing

### Logistics Optimization
- `POST /api/v1/logistics/optimize-shipping-route` - Route optimization
- `POST /api/v1/logistics/forecast-inventory` - Inventory forecasting
- `POST /api/v1/logistics/analyze-supplier-performance` - Supplier analysis
- `POST /api/v1/logistics/optimize-warehouse-layout` - Layout optimization
- `POST /api/v1/logistics/generate-procurement-insights` - Procurement insights

### Core Features
- `GET /api/v1/inventory` - Inventory management
- `GET /api/v1/asns` - Advanced shipping notices
- `GET /api/v1/orders` - Order management
- `GET /api/v1/vendors` - Vendor management
- `GET /api/v1/reports` - Reporting and analytics

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Accessibility Tests
```bash
npm run test:accessibility
```

### Security Tests
```bash
npm run test:security
```

## 🚀 Deployment

### Production Environment
```bash
# Build for production
npm run build:prod

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
See `ENVIRONMENT_SETUP.md` for complete production configuration.

### SSL/HTTPS Setup
```bash
# Generate SSL certificates
npm run generate-ssl

# Configure Nginx with SSL
# See PRODUCTION_DEPLOYMENT.md for details
```

## 📊 Performance Optimization

### Frontend
- Lazy loading of components
- Code splitting with Vite
- Image optimization
- Service worker for caching

### Backend
- Redis caching for API responses
- Database query optimization
- Connection pooling
- Rate limiting and throttling

### AI Services
- Streaming responses for real-time interaction
- Request batching for efficiency
- Error handling and fallbacks
- Performance monitoring

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Session management
- Password hashing with bcrypt

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Network Security
- HTTPS/SSL encryption
- Security headers (Helmet.js)
- CORS configuration
- Rate limiting

### Monitoring & Logging
- Comprehensive audit logging
- Error tracking
- Performance monitoring
- Security event logging

## 🌐 Browser Compatibility

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Touch-friendly interfaces

## ♿ Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the troubleshooting guide in `TROUBLESHOOTING.md`
- Review the production deployment guide in `PRODUCTION_DEPLOYMENT.md`
- Consult the environment setup guide in `ENVIRONMENT_SETUP.md`

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core logistics features
- AI-powered optimization capabilities
- Comprehensive security implementation
- Production-ready deployment configuration

## 🎯 Roadmap

### Upcoming Features
- **Real-time Collaboration**: Multi-user editing and notifications
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: React Native companion app
- **API Documentation**: Interactive API docs with Swagger
- **Multi-language Support**: Internationalization (i18n)
- **Advanced Reporting**: Custom dashboard builder

### Performance Enhancements
- **GraphQL API**: More efficient data fetching
- **WebSocket Integration**: Real-time updates
- **Progressive Web App**: Offline capabilities
- **Microservices Architecture**: Scalable backend design

---

**Built with ❤️ by the Vision79 AI Assistant & Expert Team** 