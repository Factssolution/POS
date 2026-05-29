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
let backendLoading = false;
let backendQueue = [];

const loadBackend = async () => {
  if (backendApp) return backendApp;
  
  if (backendLoading) {
    // Wait for existing load to complete
    return new Promise((resolve, reject) => {
      backendQueue.push({ resolve, reject });
    });
  }
  
  backendLoading = true;
  
  try {
    console.log('📦 Loading backend server...');
    const serverModule = require('../src/backend/server');
    backendApp = serverModule;
    console.log('✅ Backend loaded successfully');
    
    // Resolve all waiting requests
    backendQueue.forEach(({ resolve }) => resolve(backendApp));
    backendQueue = [];
    
    return backendApp;
  } catch (error) {
    console.error('❌ Failed to load backend:', error);
    backendQueue.forEach(({ reject }) => reject(error));
    backendQueue = [];
    throw error;
  } finally {
    backendLoading = false;
  }
};

// Handle all API routes through backend
app.all('/api/v1/*', async (req, res) => {
  try {
    const backend = await loadBackend();
    // Pass the request directly to backend with original URL intact
    backend(req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Backend failed to load',
        error: error.message
      });
    }
  }
});

// Handle uploads
app.use('/uploads', (req, res) => {
  res.status(501).json({
    message: 'File uploads not available in serverless mode'
  });
});

module.exports = app;
