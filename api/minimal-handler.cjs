// Minimal API handler - lazy load backend only when needed
const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint - no database needed
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL === '1' ? 'yes' : 'no',
    node_env: process.env.NODE_ENV || 'not set',
    db_host: process.env.DB_HOST ? 'configured' : 'missing'
  });
});

// Lazy load full backend on first API request
let backendApp = null;

app.use('/api/v1', async (req, res, next) => {
  try {
    // Load backend only once
    if (!backendApp) {
      console.log('Loading backend server...');
      const serverModule = require('../src/backend/server');
      backendApp = serverModule;
      console.log('Backend loaded successfully');
    }
    
    // Forward request to backend
    backendApp(req, res, next);
  } catch (error) {
    console.error('Failed to load backend:', error);
    res.status(500).json({
      success: false,
      message: 'Backend failed to load',
      error: error.message
    });
  }
});

// Handle uploads
app.use('/uploads', (req, res) => {
  res.status(501).json({
    message: 'File uploads not available in serverless mode'
  });
});

module.exports = app;
