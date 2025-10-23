const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const database = require('./config/database');
const { globalErrorHandler, notFoundHandler, gracefulShutdown } = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Import route files
const usersRoutes = require('./routes/users');
const pendingOrdersRoutes = require('./routes/pendingOrders');
const purchaseOrderDraftRoutes = require('./routes/purchaseOrderDraft');

// Helper to parse comma-separated origins from env
const parseOrigins = (value) => (value || '').split(',').map(s => s.trim()).filter(Boolean);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

    const envOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);
    const baseOrigin = process.env.FRONTEND_URL;
    const allowedOrigins = [
      ...(isProd ? [] : devOrigins),
      baseOrigin,
      ...envOrigins
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some(allowedOrigin => allowedOrigin === origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      if (!isProd) {
        console.log(`CORS blocked origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (!isProd) {
  app.use(morgan('combined'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'VOS Backend API is running!' });
});

// API Routes
app.use('/api/users', authLimiter, usersRoutes);
app.use('/api/pending-orders', pendingOrdersRoutes);
app.use('/api/purchase-order-draft', purchaseOrderDraftRoutes);

// Database connection test endpoint (disabled in production)
if (!isProd) {
  app.get('/api/db-test', async (req, res) => {
    try {
      const isConnected = await database.testConnection();
      res.json({ 
        success: isConnected, 
        message: isConnected ? 'Database connection successful' : 'Database connection failed'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Database connection error',
        error: error.message 
      });
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle undefined routes (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown(server));
process.on('SIGINT', gracefulShutdown(server));

module.exports = app;
