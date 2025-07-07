// backend/server-alternative.js
// Alternative server configuration that runs on port 5176 to avoid firewall issues

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');

// Load env vars FIRST
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate required environment variables before doing anything else
const requiredEnvVars = ['NODE_ENV', 'PORT', 'JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('---------------------------------------------------------------------------');
  console.error(`FATAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please ensure your backend/.env file is complete and correct.');
  console.error('---------------------------------------------------------------------------');
  process.exit(1);
}

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assetRoutes = require('./routes/assetRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const asnRoutes = require('./routes/asnRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const vendorRoutes = require('./routes/vendorRoutes'); 
const reportingRoutes = require('./routes/reportingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiFeedbackRoutes = require('./routes/aiFeedbackRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const aiInsightRoutes = require('./routes/aiInsightRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const systemRoutes = require('./routes/systemRoutes');
const eventRoutes = require('./routes/eventRoutes');

const startApp = async () => {
    // 1. Connect to Database first
    await connectDB();

    // 2. Initialize Express App after DB is ready
    const app = express();
    
    // 3. Middleware - Allow all origins for public access
    const corsOptions = {
      origin: true, // Allow all origins
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP', 'Cache-Control'],
    };
    app.use(cors(corsOptions));
    
    // Add IP address logging middleware
    app.use((req, res, next) => {
      const clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      req.ip;
      
      console.log(`Request from IP: ${clientIP} - ${req.method} ${req.path}`);
      req.clientIP = clientIP;
      next();
    });
    
    // Configure helmet with relaxed settings for public access
    app.use(helmet({
      frameguard: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "*"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      noCache: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev')); 
    }
    app.use(express.json({ limit: '10mb' })); 
    app.use(express.urlencoded({ extended: true })); 
    
    // 4. Rate Limiting
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    });
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false,
        message: 'Too many login/register attempts from this IP, please try again after 15 minutes',
    });

    // 5. Mount Routes
    const API_PREFIX = '/api/v1';

    app.get('/', (req, res) => {
      res.redirect(API_PREFIX);
    });
    
    app.use(API_PREFIX, generalLimiter);
    app.get(API_PREFIX, (req, res) => res.json({ message: 'Welcome to Vision79 SIWM Backend API! V1' }));
    
    app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
    app.use(`${API_PREFIX}/users`, userRoutes);
    app.use(`${API_PREFIX}/assets`, assetRoutes);
    app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
    app.use(`${API_PREFIX}/asns`, asnRoutes);
    app.use(`${API_PREFIX}/orders`, orderRoutes);
    app.use(`${API_PREFIX}/dispatch`, dispatchRoutes);
    app.use(`${API_PREFIX}/vendors`, vendorRoutes); 
    app.use(`${API_PREFIX}/reports`, reportingRoutes);
    app.use(`${API_PREFIX}/notifications`, notificationRoutes);
    app.use(`${API_PREFIX}/ai-feedback`, aiFeedbackRoutes);
    app.use(`${API_PREFIX}/gemini`, geminiRoutes);
    app.use(`${API_PREFIX}/ai-insights`, aiInsightRoutes);
    app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
    app.use(`${API_PREFIX}/system`, systemRoutes);
    app.use(`${API_PREFIX}/events`, eventRoutes);
    
    // 6. Error Handlers
    app.use(notFound); 
    app.use(errorHandler); 

    // 7. Start Server on port 4000 (HTTPS)
    const PORT = 4000;

    // Use HTTP for development to avoid SSL issues
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend API server running on http://0.0.0.0:${PORT}`);
      console.log(`Access from other devices: http://[YOUR_IP_ADDRESS]:${PORT}`);
      console.log(`API endpoint: http://[YOUR_IP_ADDRESS]:${PORT}/api/v1`);
    });
};

// Start the application
startApp().catch(error => {
    console.error("Failed to start the application due to a fatal error:", error);
    process.exit(1);
}); 