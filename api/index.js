// Vercel Serverless Function Entry Point
// This file must use CommonJS since backend uses require()
const app = require('../src/backend/server');

module.exports = app;
