// Vercel Serverless Function Entry Point
// Rename to .cjs to use CommonJS in ESM project
const app = require('../src/backend/server');

module.exports = app;
