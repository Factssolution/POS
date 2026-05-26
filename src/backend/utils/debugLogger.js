// Debug Logger - Centralized logging control
// Set DEBUG_MODE = false to hide all debug logs in production

const DEBUG_MODE = process.env.NODE_ENV !== 'production';

const debugLogger = {
  log: (...args) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (DEBUG_MODE) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always show errors
    console.error(...args);
  },
  info: (...args) => {
    if (DEBUG_MODE) {
      console.info(...args);
    }
  }
};

module.exports = debugLogger;
