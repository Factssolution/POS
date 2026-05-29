// Minimal Vercel serverless handler - test basic functionality first
const express = require('express');

const app = express();

// Simple health check that doesn't require database
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'POS Backend API is running',
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL === '1' ? 'yes' : 'no',
    node_env: process.env.NODE_ENV || 'not set'
  });
});

// Placeholder for API routes - will be added once we confirm basic functionality works
app.use('/api/v1', (req, res) => {
  res.json({
    success: false,
    message: 'API routes not yet configured. Backend is loading successfully.'
  });
});

module.exports = app;
