const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Load database (lazy - won't connect on Vercel)
let sequelize;
try {
  sequelize = require('./config/database');
} catch (err) {
  console.warn('⚠️  Database not available:', err.message);
}

// Import routes (wrap in try-catch to prevent crashes)
const routeImports = [
  'auth', 'products', 'employees', 'suppliers', 'transactions',
  'orders', 'dashboard', 'settings', 'reports', 'categories',
  'backups', 'users', 'expenses', 'licenses', 'blobs', 'tenants'
];

const routes = {};
routeImports.forEach(name => {
  try {
    routes[name] = require(`./routes/${name}`);
  } catch (err) {
    console.warn(`⚠️  ${name} routes not available:`, err.message);
    const express = require('express');
    routes[name] = express.Router();
    routes[name].use((req, res) => res.status(503).json({ error: `${name} service unavailable` }));
  }
});

const { auth, products, employees, suppliers, transactions, orders, dashboard, settings, reports, categories, backups, users, expenses, licenses, blobs, tenants } = routes;

// Import middleware
let licenseValidator;
try {
  licenseValidator = require('./middleware/licenseValidator');
} catch (err) {
  console.warn('⚠️  License validator not available:', err.message);
  licenseValidator = (req, res, next) => next(); // Pass-through
}

let attachTenant;
try {
  const tenantMiddleware = require('./middleware/tenant');
  attachTenant = tenantMiddleware.attachTenant;
} catch (err) {
  console.warn('⚠️  Tenant middleware not available:', err.message);
  attachTenant = (req, res, next) => next(); // Pass-through
}

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://pos-iota-sage.vercel.app', 'https://pos-iota-sage-henna.vercel.app'];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// API Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.use('/api/v1/auth', auth);

// Attach tenant context to all authenticated requests
app.use('/api/v1', attachTenant);

// Apply license validation AFTER auth but BEFORE other routes
app.use('/api/v1', licenseValidator);

// Protected routes (license validated)
app.use('/api/v1/products', products);
app.use('/api/v1/employees', employees);
app.use('/api/v1/suppliers', suppliers);
app.use('/api/v1/transactions', transactions);
app.use('/api/v1/orders', orders);
app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1/settings', backups);  // Backup routes FIRST (specific paths)
app.use('/api/v1/settings', settings); // Settings routes SECOND (catch-all :key)
app.use('/api/v1/reports', reports);
app.use('/api/v1/categories', categories);
app.use('/api/v1/users', users);  // User management routes
app.use('/api/v1/expenses', expenses);  // Expense management routes
app.use('/api/v1/settings/license', licenses);  // License routes (AFTER settings)
app.use('/api/v1/blobs', blobs);  // BLOB storage routes (images, logos, documents)
app.use('/api/v1/tenants', tenants);  // Multi-tenant management routes (Super Admin only)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'POS System API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const { initializeScheduledBackups } = require('./controllers/scheduledBackup');

const startServer = async () => {
  // Only start listener if NOT running on Vercel serverless
  if (process.env.VERCEL !== '1') {
    try {
      // Start server first (before database connection)
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API URL: http://localhost:${PORT}/api/v1`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        
        // Initialize scheduled backups ONLY on local/traditional servers
        // Vercel serverless doesn't support long-running cron jobs
        if (process.env.VERCEL !== '1') {
          initializeScheduledBackups();
        }
      });

      // Test database connection (non-blocking)
      if (sequelize && process.env.VERCEL !== '1') {
        try {
          await sequelize.authenticate();
          console.log('✅ Database connected successfully');
          
          // Sync database (create tables if not exist)
          await sequelize.sync({ alter: false });
          console.log('✅ Database synced');
        } catch (dbError) {
          console.error('⚠️  Database connection failed:', dbError.message);
          console.log('⚠️  Server will continue running but database operations will fail');
        }
      } else if (process.env.VERCEL === '1') {
        console.log('ℹ️  Using Supabase REST API on Vercel (no direct DB connection)');
      }
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      // Don't use process.exit() in serverless - throw error instead
      if (process.env.VERCEL === '1') {
        throw error;
      } else {
        process.exit(1);
      }
    }
  } else {
    // Vercel serverless mode - just connect to database
    console.log('🚀 Running on Vercel serverless');
  }
};

startServer();

module.exports = app;
