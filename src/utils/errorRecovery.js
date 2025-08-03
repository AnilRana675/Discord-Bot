import { logger, logError, logSecurityEvent } from './logger.js';
import { DatabaseService } from './database.js';

export class ErrorRecoverySystem {
  constructor() {
    this.retryAttempts = new Map();
    this.circuitBreakers = new Map();
    this.fallbackStrategies = new Map();
  }

  // Circuit breaker pattern implementation
  createCircuitBreaker(name, options = {}) {
    const {
      failureThreshold = 5,
      recoveryTimeout = 60000, // 1 minute
      monitoringWindow = 300000  // 5 minutes
    } = options;

    this.circuitBreakers.set(name, {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      lastFailure: null,
      failureThreshold,
      recoveryTimeout,
      monitoringWindow,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      }
    });
  }

  async executeWithCircuitBreaker(breakerName, operation, fallback = null) {
    const breaker = this.circuitBreakers.get(breakerName);
    if (!breaker) {
      throw new Error(`Circuit breaker '${breakerName}' not found`);
    }

    breaker.stats.totalRequests++;

    // Check if circuit is open
    if (breaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure < breaker.recoveryTimeout) {
        logger.warn(`Circuit breaker '${breakerName}' is OPEN, using fallback`);
        return fallback ? await fallback() : null;
      } else {
        breaker.state = 'HALF_OPEN';
        logger.info(`Circuit breaker '${breakerName}' transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failure count
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        logger.info(`Circuit breaker '${breakerName}' recovered, state: CLOSED`);
      }
      
      breaker.stats.successfulRequests++;
      return result;
      
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      breaker.stats.failedRequests++;

      if (breaker.failures >= breaker.failureThreshold) {
        breaker.state = 'OPEN';
        logger.error(`Circuit breaker '${breakerName}' tripped, state: OPEN`);
        
        // Log security event for multiple failures
        logSecurityEvent('CIRCUIT_BREAKER_OPEN', null, {
          breaker: breakerName,
          failures: breaker.failures,
          threshold: breaker.failureThreshold
        });
      }

      if (fallback) {
        logger.warn(`Operation failed, using fallback for '${breakerName}'`);
        return await fallback();
      }

      throw error;
    }
  }

  // Retry with exponential backoff
  async retryWithBackoff(operation, options = {}) {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = () => true
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation(attempt);
        
        // Reset retry count on success
        if (attempt > 1) {
          logger.info(`Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !retryCondition(error, attempt)) {
          logError(error, { 
            finalAttempt: attempt, 
            maxAttempts,
            operation: operation.name || 'anonymous'
          });
          break;
        }

        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Graceful degradation strategies
  registerFallbackStrategy(operationName, strategy) {
    this.fallbackStrategies.set(operationName, strategy);
  }

  async executeWithFallback(operationName, primaryOperation, context = {}) {
    try {
      return await primaryOperation();
    } catch (error) {
      logError(error, { operation: operationName, context });
      
      const fallbackStrategy = this.fallbackStrategies.get(operationName);
      if (fallbackStrategy) {
        logger.info(`Using fallback strategy for '${operationName}'`);
        return await fallbackStrategy(error, context);
      }
      
      throw error;
    }
  }

  // Health monitoring and auto-recovery
  startHealthMonitoring(interval = 60000) {
    setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }

  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'healthy'
    };

    // Check database health
    try {
      healthStatus.services.database = DatabaseService.healthCheck() ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthStatus.services.database = 'error';
      logError(error, { service: 'database' });
    }

    // Check circuit breakers
    for (const [name, breaker] of this.circuitBreakers) {
      healthStatus.services[`circuit_breaker_${name}`] = breaker.state.toLowerCase();
    }

    // Determine overall health
    const unhealthyServices = Object.values(healthStatus.services)
      .filter(status => status !== 'healthy' && status !== 'closed');
    
    if (unhealthyServices.length > 0) {
      healthStatus.overall = 'degraded';
      logger.warn('System health degraded', { 
        unhealthyServices: unhealthyServices.length,
        details: healthStatus.services 
      });
    }

    return healthStatus;
  }

  // Error categorization and handling
  categorizeError(error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return 'network';
    }
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return 'client';
    }
    if (error.response?.status >= 500) {
      return 'server';
    }
    if (error.name === 'ValidationError') {
      return 'validation';
    }
    if (error.name === 'RateLimitError') {
      return 'rate_limit';
    }
    
    return 'unknown';
  }

  // Error recovery strategies
  async recoverFromError(error, context = {}) {
    const category = this.categorizeError(error);
    
    switch (category) {
      case 'network':
        return await this.handleNetworkError(error, context);
      case 'rate_limit':
        return await this.handleRateLimitError(error, context);
      case 'server':
        return await this.handleServerError(error, context);
      case 'validation':
        return await this.handleValidationError(error, context);
      default:
        return await this.handleUnknownError(error, context);
    }
  }

  async handleNetworkError(error, context) {
    logger.warn('Network error detected, implementing recovery strategy', { error: error.message });
    
    // Implement exponential backoff retry
    return await this.retryWithBackoff(
      async () => {
        throw error; // Will be retried by the calling function
      },
      {
        maxAttempts: 3,
        baseDelay: 2000,
        retryCondition: (err) => err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND'
      }
    );
  }

  async handleRateLimitError(error, context) {
    const retryAfter = error.retryAfter || 60000; // Default 1 minute
    logger.warn(`Rate limit hit, waiting ${retryAfter}ms before retry`);
    
    await new Promise(resolve => setTimeout(resolve, retryAfter));
    return null; // Caller should retry
  }

  async handleServerError(error, context) {
    logger.error('Server error detected', { error: error.message, status: error.response?.status });
    
    // For 5xx errors, use circuit breaker and fallback
    if (context.circuitBreakerName) {
      const breaker = this.circuitBreakers.get(context.circuitBreakerName);
      if (breaker) {
        breaker.failures++;
        if (breaker.failures >= breaker.failureThreshold) {
          breaker.state = 'OPEN';
        }
      }
    }
    
    return null; // Use fallback
  }

  async handleValidationError(error, context) {
    logSecurityEvent('VALIDATION_ERROR', context.userId, {
      error: error.message,
      input: context.input
    });
    
    throw new Error('Input validation failed. Please check your input and try again.');
  }

  async handleUnknownError(error, context) {
    logError(error, { category: 'unknown', context });
    throw new Error('An unexpected error occurred. Please try again later.');
  }

  // Get system statistics
  getStats() {
    const stats = {
      circuitBreakers: {},
      retryAttempts: this.retryAttempts.size,
      fallbackStrategies: this.fallbackStrategies.size
    };

    for (const [name, breaker] of this.circuitBreakers) {
      stats.circuitBreakers[name] = {
        state: breaker.state,
        failures: breaker.failures,
        ...breaker.stats
      };
    }

    return stats;
  }
}

// Global error recovery system
export const errorRecovery = new ErrorRecoverySystem();

// Initialize circuit breakers for common services
errorRecovery.createCircuitBreaker('github_ai', {
  failureThreshold: 5,
  recoveryTimeout: 60000
});

errorRecovery.createCircuitBreaker('discord_api', {
  failureThreshold: 3,
  recoveryTimeout: 30000
});

// Register common fallback strategies
errorRecovery.registerFallbackStrategy('ai_generation', async (error, context) => {
  return "I'm experiencing technical difficulties right now. Please try again in a moment! (´﹏｀)";
});

errorRecovery.registerFallbackStrategy('image_generation', async (error, context) => {
  return {
    embeds: [{
      title: '🖼️ Image Service Unavailable',
      description: 'Sorry, image generation is temporarily unavailable. Please try again later!',
      color: 0xFFB6C1
    }]
  };
});

// Start health monitoring
errorRecovery.startHealthMonitoring();

export default errorRecovery;
