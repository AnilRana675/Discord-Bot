import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // File logging - General logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Error-only logging
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: logFormat
    }),
    
    // Performance logging
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Audit logger for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10 // Keep more audit logs
    })
  ]
});

// Security event logging
export const logSecurityEvent = (event, userId, details = {}) => {
  auditLogger.info({
    event,
    userId,
    timestamp: new Date().toISOString(),
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    ...details
  });
};

// Performance event logging
export const logPerformanceMetric = (metric, value, context = {}) => {
  logger.info('Performance Metric', {
    metric,
    value,
    timestamp: Date.now(),
    ...context
  });
};

// Command execution logging
export const logCommandExecution = (commandName, userId, executionTime, success = true, error = null) => {
  const logData = {
    command: commandName,
    userId,
    executionTime,
    success,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
  }

  if (success) {
    logger.info('Command executed', logData);
  } else {
    logger.error('Command failed', logData);
  }
};

// Error logging helper
export const logError = (error, context = {}) => {
  logger.error(error.message, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  });
};

// Rate limiting events
export const logRateLimit = (userId, commandName, limit) => {
  logSecurityEvent('RATE_LIMIT_EXCEEDED', userId, {
    command: commandName,
    limit,
    action: 'blocked'
  });
};

// API usage logging
export const logApiUsage = (endpoint, responseTime, success, cacheHit = false) => {
  logPerformanceMetric('api_usage', {
    endpoint,
    responseTime,
    success,
    cacheHit,
    timestamp: Date.now()
  });
};

export default logger;
