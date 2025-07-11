// backend/server.js
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

// Add a specific, non-fatal warning for the Gemini API Key
if (!process.env.GEMINI_API_KEY) {
  console.warn('---------------------------------------------------------------------------');
  console.warn('WARNING: GEMINI_API_KEY is not set in backend/.env');
  console.warn('The AI Chatbot and AI Insight features will not be available.');
  console.warn('Please get an API key from Google AI Studio and add it to the .env file.');
  console.warn('---------------------------------------------------------------------------');
}

// Add a specific, non-fatal warning for the Email Service
const emailEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEmailVars = emailEnvVars.filter(varName => !process.env[varName]);
if (missingEmailVars.length > 0) {
  console.warn('---------------------------------------------------------------------------');
  console.warn(`WARNING: Email service is not fully configured. Missing: ${missingEmailVars.join(', ')}`);
  console.warn('Automated email notifications will be disabled.');
  console.warn('---------------------------------------------------------------------------');
}

const { connectDB } = require('./config/db'); // Import connectDB
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
const geminiRoutes = require('./routes/geminiRoutes'); // For chatbot
const aiInsightRoutes = require('./routes/aiInsightRoutes'); // For specific insights
const dashboardRoutes = require('./routes/dashboardRoutes'); // Import Dashboard routes
const systemRoutes = require('./routes/systemRoutes');
const eventRoutes = require('./routes/eventRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes'); // For advanced logistics optimization
const warehouseRoutes = require('./routes/warehouseRoutes'); // For multi-warehouse support
const supportRoutes = require('./routes/supportRoutes'); // For customer support

const startApp = async () => {
    // 1. Connect to Database first
    await connectDB();

    // 2. Initialize Express App after DB is ready
    const app = express();
    
    // Disable ETag to prevent 304 Not Modified responses
    app.disable('etag');

    // Add no-cache headers to all API responses
    app.use((req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    });

    // 3. Middleware
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

    if (process.env.NODE_ENV === 'development' && allowedOrigins.length === 0) {
      // Allow all localhost variations and common development ports
      allowedOrigins.push(
        'http://localhost:5173', 'http://localhost:5176', 'http://localhost:3000', 
        'http://localhost:8000', 'http://127.0.0.1:5500', 'http://localhost:4173', 
        'http://localhost:3001', 'http://localhost:4000',
        // Allow network access for scalability
        'http://0.0.0.0:5176', 'http://0.0.0.0:5173', 'http://0.0.0.0:4000'
      );
    }
    
    // Add public IP access support
    if (process.env.ALLOW_PUBLIC_IP === 'true') {
      // Allow all origins for public access (use with caution in production)
      allowedOrigins.push('*');
    }
    
    const corsOptions = {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }
        
        // Allow all origins in development mode or when public IP access is enabled
        if (process.env.NODE_ENV === 'development' || process.env.ALLOW_PUBLIC_IP === 'true') {
          return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Log blocked origins for debugging
        console.log(`CORS blocked origin: ${origin}`);
        return callback(new Error(`The CORS policy for this site does not allow access from the specified Origin: ${origin}`));
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP', 'Cache-Control'],
    };
    app.use(cors(corsOptions));
    
    // Add IP address logging middleware for public access
    app.use((req, res, next) => {
      const clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      req.ip;
      
      // Log client IP for debugging public access
      if (process.env.ALLOW_PUBLIC_IP === 'true') {
        console.log(`Request from IP: ${clientIP} - ${req.method} ${req.path}`);
      }
      
      // Store IP in request object for potential use in controllers
      req.clientIP = clientIP;
      next();
    });
    
    // Configure helmet with modern security headers
    // This replaces deprecated 'Expires' with 'Cache-Control' and 'X-Frame-Options' with CSP 'frame-ancestors'
    app.use(helmet({
      // Explicitly disable deprecated headers
      frameguard: false, // Disable X-Frame-Options
      // Configure Content Security Policy with frame-ancestors
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
          frameAncestors: ["'self'"], // Modern replacement for X-Frame-Options
        },
      },
      // Use modern cache control instead of Expires
      noCache: true,
      // Disable deprecated headers
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Add a test route to verify headers
    app.get('/test-headers', (req, res) => {
      res.json({
        message: 'Headers test',
        headers: {
          'cache-control': res.getHeader('Cache-Control'),
          'expires': res.getHeader('Expires'),
          'x-frame-options': res.getHeader('X-Frame-Options'),
          'content-security-policy': res.getHeader('Content-Security-Policy')
        }
      });
    });
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

    // Handle root route requests gracefully by redirecting to the main API endpoint
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
    app.use(`${API_PREFIX}/logistics`, logisticsRoutes);
    app.use(`${API_PREFIX}/warehouses`, warehouseRoutes);
    app.use(`${API_PREFIX}/support`, supportRoutes);
    
    // 6. Error Handlers
    app.use(notFound); 
    app.use(errorHandler); 

    // 7. Start Server
    const PORT = process.env.PORT || 3001;

    // --- Port Sanity Check ---
    if (['5432', '3306', '27017', '1433'].includes(String(PORT))) {
        console.warn('---------------------------------------------------------------------------');
        console.warn(`[WARNING] Your application PORT is set to ${PORT}, which is a common database port.`);
        console.warn(`This can cause conflicts. The application server should run on a dedicated port like 4000.`);
        console.warn('---------------------------------------------------------------------------');
    }

    // Use HTTP for development to avoid SSL issues
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running in ${process.env.NODE_ENV} mode on http://0.0.0.0:${PORT}`);
      console.log(`Access from other devices: http://[YOUR_IP_ADDRESS]:${PORT}`);
    });
};

// Start the application
startApp().catch(error => {
    console.error("Failed to start the application due to a fatal error:", error);
    process.exit(1);
});
