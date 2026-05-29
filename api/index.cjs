// Vercel Serverless Function Entry Point (CommonJS)
// This file is .cjs so it can use require()

const path = require('path');

// Load environment variables for local development
if (process.env.VERCEL !== '1') {
  require('dotenv').config({ 
    path: path.join(__dirname, '../src/backend/.env.production') 
  });
}

// Dynamically import the backend server
// Using require.ensure or direct require since this is CommonJS
const app = require('../src/backend/server');

module.exports = app;
