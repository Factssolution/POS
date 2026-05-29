// Vercel Serverless Function Entry Point
// Load environment variables first (Vercel injects them, but ensure they're available)
if (process.env.VERCEL !== '1') {
  require('dotenv').config({ path: require('path').join(__dirname, '../src/backend/.env.production') });
}

// Import and export the Express app
const app = require('../src/backend/server');

module.exports = app;
