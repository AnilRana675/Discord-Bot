// Performance monitoring and caching utilities
import EventEmitter from 'events';

export class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      commandExecutions: new Map(),
      responseTime: new Map(),
      memoryUsage: [],
      errorCount: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.startTime = Date.now();
    this.monitoringInterval = null;
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor memory usage every 30 seconds
    this.monitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });
      
      // Keep only last 100 entries
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }
      
      // Check for memory leaks
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        console.warn('⚠️  High memory usage detected:', this.formatBytes(memUsage.heapUsed));
      }
    }, 30000);
  }

  recordCommand(commandName, executionTime) {
    if (!this.metrics.commandExecutions.has(commandName)) {
      this.metrics.commandExecutions.set(commandName, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0
      });
    }
    
    const stats = this.metrics.commandExecutions.get(commandName);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
  }

  recordError(commandName = 'unknown') {
    this.metrics.errorCount++;
    if (this.metrics.commandExecutions.has(commandName)) {
      this.metrics.commandExecutions.get(commandName).errors++;
    }
  }

  recordApiCall() {
    this.metrics.apiCalls++;
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    
    return {
      uptime: this.formatUptime(uptime),
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal)
      },
      commands: Object.fromEntries(this.metrics.commandExecutions),
      api: {
        totalCalls: this.metrics.apiCalls,
        cacheHitRate: this.getCacheHitRate()
      },
      errors: this.metrics.errorCount
    };
  }

  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(2) + '%' : '0%';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Enhanced caching system
export class EnhancedCache {
  constructor(maxSize = 1000, ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.accessTimes = new Map();
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key, value, customTtl = null) {
    const expiryTime = Date.now() + (customTtl || this.ttl);
    
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expiry: expiryTime,
      hits: 0
    });
    
    this.accessTimes.set(key, Date.now());
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }
    
    item.hits++;
    this.accessTimes.set(key, Date.now());
    
    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now > item.expiry) {
        this.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRates: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        hits: item.hits
      }))
    };
  }
}

// Rate limiter with memory efficiency
export class RateLimiter {
  constructor() {
    this.limits = new Map();
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  checkLimit(key, limit = 10, window = 60000) {
    const now = Date.now();
    const windowStart = now - window;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const requests = this.limits.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    this.limits.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, requests] of this.limits) {
      const validRequests = requests.filter(time => now - time < maxAge);
      if (validRequests.length === 0) {
        this.limits.delete(key);
      } else {
        this.limits.set(key, validRequests);
      }
    }
  }

  getStats() {
    return {
      activeKeys: this.limits.size,
      totalRequests: Array.from(this.limits.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// Connection pooling for HTTP requests
export class ConnectionPool {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.activeConnections < this.maxConnections) {
        this.activeConnections++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.activeConnections--;
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      this.activeConnections++;
      resolve();
    }
  }

  getStats() {
    return {
      active: this.activeConnections,
      queued: this.queue.length,
      max: this.maxConnections
    };
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const responseCache = new EnhancedCache(500, 300000); // 5 minutes
export const rateLimiter = new RateLimiter();
export const connectionPool = new ConnectionPool(15);

// Cleanup on process exit
process.on('SIGINT', () => {
  performanceMonitor.cleanup();
  responseCache.clear();
});

process.on('SIGTERM', () => {
  performanceMonitor.cleanup();
  responseCache.clear();
});
