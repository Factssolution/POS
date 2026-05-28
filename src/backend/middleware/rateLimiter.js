const rateLimit = require('express-rate-limit');

// Helper function to safely extract IP addresses with IPv6 support
const ipKeyGenerator = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  return req.user ? `user_${req.user.id}` : ip;
};

// Temporarily disabled for Railway deployment - IPv6 validation issue
// General API rate limiter
const generalLimiter = (req, res, next) => next();

// Backup READ operations rate limiter (list, config, stats - more permissive)
const backupReadLimiter = (req, res, next) => next();

// Backup WRITE operations rate limiter (create, restore, delete - stricter)
const backupWriteLimiter = (req, res, next) => next();

// Legacy backupLimiter (alias for backward compatibility - uses write limiter)
const backupLimiter = backupWriteLimiter;

// Settings update rate limiter
const settingsLimiter = (req, res, next) => next();

module.exports = {
  generalLimiter,
  backupLimiter,
  backupReadLimiter,
  backupWriteLimiter,
  settingsLimiter
};
