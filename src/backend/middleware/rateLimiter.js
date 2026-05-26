const rateLimit = require('express-rate-limit');

// Helper function to safely extract IP addresses with IPv6 support
const ipKeyGenerator = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  return req.user ? `user_${req.user.id}` : ip;
};

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  validate: { ipKeyGenerator: false } // Disable IPv6 validation for custom keyGenerator
});

// Backup READ operations rate limiter (list, config, stats - more permissive)
const backupReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // allow 100 read requests per 15 minutes
  message: {
    success: false,
    message: 'Too many backup requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: ipKeyGenerator,
  validate: { ipKeyGenerator: false } // Disable IPv6 validation for custom keyGenerator
});

// Backup WRITE operations rate limiter (create, restore, delete - stricter)
const backupWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit to 10 write operations per 15 minutes
  message: {
    success: false,
    message: 'Too many backup operations. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: ipKeyGenerator,
  validate: { ipKeyGenerator: false } // Disable IPv6 validation for custom keyGenerator
});

// Legacy backupLimiter (alias for backward compatibility - uses write limiter)
const backupLimiter = backupWriteLimiter;

// Settings update rate limiter
const settingsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 settings updates per minute
  message: {
    success: false,
    message: 'Too many settings updates. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  validate: { ipKeyGenerator: false } // Disable IPv6 validation for custom keyGenerator
});

module.exports = {
  generalLimiter,
  backupLimiter,
  backupReadLimiter,
  backupWriteLimiter,
  settingsLimiter
};

