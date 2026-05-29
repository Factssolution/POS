/**
 * Production Logger Utility
 * Prevents sensitive data exposure in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableInProduction: boolean;
  enableTimestamps: boolean;
}

const config: LoggerConfig = {
  level: import.meta.env.DEV ? 'debug' : 'error',
  enableInProduction: false,
  enableTimestamps: true
};

const logger = {
  debug: (message: string, ...data: any[]) => {
    if (config.level === 'debug' && import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
  },

  info: (message: string, ...data: any[]) => {
    if ((config.level === 'debug' || config.level === 'info') && import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...data);
    }
  },

  warn: (message: string, ...data: any[]) => {
    if (config.level !== 'error') {
      console.warn(`[WARN] ${message}`, ...data);
    }
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      // Only log error details in development
      if (import.meta.env.DEV) {
        console.error(error);
      }
      // In production, send to error monitoring service (e.g., Sentry)
      // reportErrorToSentry(message, error);
    }
  },

  // Log API calls (sanitized)
  apiCall: (method: string, endpoint: string, status?: number) => {
    if (import.meta.env.DEV) {
      console.info(`[API] ${method} ${endpoint}${status ? ` → ${status}` : ''}`);
    }
  },

  // Log authentication events (sanitized)
  auth: (event: string, email?: string) => {
    if (import.meta.env.DEV) {
      console.info(`[AUTH] ${event}${email ? ` - ${email}` : ''}`);
    }
  },

  // Performance logging
  performance: (label: string, startTime: number) => {
    if (import.meta.env.DEV) {
      const duration = performance.now() - startTime;
      console.info(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }
};

export { logger };
export default logger;
