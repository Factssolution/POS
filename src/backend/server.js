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

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const employeeRoutes = require('./routes/employees');
const supplierRoutes = require('./routes/suppliers');
const transactionRoutes = require('./routes/transactions');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');
const categoryRoutes = require('./routes/categories');
const backupRoutes = require('./routes/backups');
const userRoutes = require('./routes/users');  // New user management routes
const expenseRoutes = require('./routes/expenses');  // Expense management routes
const licenseRoutes = require('./routes/licenses');  // License management routes
const blobRoutes = require('./routes/blobs');  // BLOB storage routes (images, logos, documents)
const tenantRoutes = require('./routes/tenants');  // Multi-tenant management routes

// Import middleware
const licenseValidator = require('./middleware/licenseValidator');
const { attachTenant } = require('./middleware/tenant');  // Multi-tenant middleware

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

app.use('/api/v1/auth', authRoutes);

// Attach tenant context to all authenticated requests
app.use('/api/v1', attachTenant);

// Apply license validation AFTER auth but BEFORE other routes
app.use('/api/v1', licenseValidator);

// Protected routes (license validated)
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', backupRoutes);  // Backup routes FIRST (specific paths)
app.use('/api/v1/settings', settingsRoutes); // Settings routes SECOND (catch-all :key)
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);  // User management routes
app.use('/api/v1/expenses', expenseRoutes);  // Expense management routes
app.use('/api/v1/settings/license', licenseRoutes);  // License routes (AFTER settings)
app.use('/api/v1/blobs', blobRoutes);  // BLOB storage routes (images, logos, documents)
app.use('/api/v1/tenants', tenantRoutes);  // Multi-tenant management routes (Super Admin only)

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
