// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const sequelize = require('../config/database');

// Import routes
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const employeeRoutes = require('../routes/employees');
const supplierRoutes = require('../routes/suppliers');
const transactionRoutes = require('../routes/transactions');
const orderRoutes = require('../routes/orders');
const dashboardRoutes = require('../routes/dashboard');
const settingsRoutes = require('../routes/settings');
const reportsRoutes = require('../routes/reports');
const categoryRoutes = require('../routes/categories');
const backupRoutes = require('../routes/backups');
const userRoutes = require('../routes/users');
const expenseRoutes = require('../routes/expenses');
const licenseRoutes = require('../routes/licenses');

// Import middleware
const licenseValidator = require('../middleware/licenseValidator');

const app = express();

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://pos-iota-sage.vercel.app'];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
    platform: 'vercel-serverless'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/backups', backupRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/licenses', licenseRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Export for Vercel serverless
module.exports = async (req, res) => {
  // Initialize database connection on first invocation
  if (!module.exports.dbInitialized) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced');
      module.exports.dbInitialized = true;
    } catch (error) {
      console.error('⚠️ Database error:', error.message);
      module.exports.dbInitialized = true; // Don't retry on every request
    }
  }
  
  return app(req, res);
};
