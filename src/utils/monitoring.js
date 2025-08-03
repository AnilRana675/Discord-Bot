// Automated monitoring and cleanup tasks
import cron from 'node-cron';
import { performanceMonitor, responseCache, rateLimiter } from './performance.js';
import { config } from '../config/optimized.js';

export class MonitoringService {
  constructor(client) {
    this.client = client;
    this.isRunning = false;
    this.tasks = new Map();
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Monitoring service is already running');
      return;
    }

    console.log('🔍 Starting monitoring service...');
    this.isRunning = true;

    // Memory monitoring (every 30 seconds)
    this.tasks.set('memory', cron.schedule('*/30 * * * * *', () => {
      this.monitorMemory();
    }, { scheduled: false }));

    // Cache cleanup (every 5 minutes)
    this.tasks.set('cache', cron.schedule('*/5 * * * *', () => {
      this.cleanupCache();
    }, { scheduled: false }));

    // Rate limiter cleanup (every 10 minutes)
    this.tasks.set('rateLimit', cron.schedule('*/10 * * * *', () => {
      this.cleanupRateLimiter();
    }, { scheduled: false }));

    // Performance report (every hour)
    this.tasks.set('performance', cron.schedule('0 * * * *', () => {
      this.generatePerformanceReport();
    }, { scheduled: false }));

    // Health check (every 15 minutes)
    this.tasks.set('health', cron.schedule('*/15 * * * *', () => {
      this.performHealthCheck();
    }, { scheduled: false }));

    // Start all tasks
    this.tasks.forEach((task, name) => {
      task.start();
      console.log(`✅ Started ${name} monitoring task`);
    });

    console.log('🔍 Monitoring service started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Monitoring service is not running');
      return;
    }

    console.log('🛑 Stopping monitoring service...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`🛑 Stopped ${name} monitoring task`);
    });

    this.tasks.clear();
    this.isRunning = false;
    console.log('🛑 Monitoring service stopped');
  }

  monitorMemory() {
    const memUsage = process.memoryUsage();
    const maxHeap = config.performance.memory.maxHeapSize;
    
    if (memUsage.heapUsed > maxHeap) {
      console.warn(`⚠️  High memory usage: ${this.formatBytes(memUsage.heapUsed)} / ${this.formatBytes(maxHeap)}`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️  Forced garbage collection');
      }
      
      // Clear old cache entries
      responseCache.cleanup();
      console.log('🧹 Cleaned up cache');
    }
  }

  cleanupCache() {
    const sizeBefore = responseCache.getStats().size;
    responseCache.cleanup();
    const sizeAfter = responseCache.getStats().size;
    
    if (sizeBefore !== sizeAfter) {
      console.log(`🧹 Cache cleanup: ${sizeBefore} → ${sizeAfter} entries`);
    }
  }

  cleanupRateLimiter() {
    const statsBefore = rateLimiter.getStats();
    rateLimiter.cleanup();
    const statsAfter = rateLimiter.getStats();
    
    if (statsBefore.activeKeys !== statsAfter.activeKeys) {
      console.log(`🧹 Rate limiter cleanup: ${statsBefore.activeKeys} → ${statsAfter.activeKeys} active keys`);
    }
  }

  generatePerformanceReport() {
    const stats = performanceMonitor.getStats();
    const memUsage = process.memoryUsage();
    
    console.log('\n📊 === HOURLY PERFORMANCE REPORT ===');
    console.log(`🕐 Uptime: ${stats.uptime}`);
    console.log(`🧠 Memory: ${this.formatBytes(memUsage.heapUsed)} used`);
    console.log(`🎯 Commands: ${Object.keys(stats.commands).length} types, ${Object.values(stats.commands).reduce((sum, cmd) => sum + cmd.count, 0)} total`);
    console.log(`📞 API Calls: ${stats.api.totalCalls}`);
    console.log(`🚀 Cache Hit Rate: ${stats.api.cacheHitRate}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    // Top 3 most used commands
    const topCommands = Object.entries(stats.commands)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3);
    
    if (topCommands.length > 0) {
      console.log('🏆 Top Commands:');
      topCommands.forEach(([cmd, data], i) => {
        console.log(`  ${i + 1}. ${cmd}: ${data.count} uses (${data.avgTime.toFixed(0)}ms avg)`);
      });
    }
    
    console.log('=================================\n');
  }

  async performHealthCheck() {
    const issues = [];
    
    // Check Discord connection
    if (!this.client.isReady()) {
      issues.push('Discord client not ready');
    }
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > config.performance.memory.maxHeapSize) {
      issues.push(`High memory usage: ${this.formatBytes(memUsage.heapUsed)}`);
    }
    
    // Check error rate
    const stats = performanceMonitor.getStats();
    const totalCommands = Object.values(stats.commands).reduce((sum, cmd) => sum + cmd.count, 0);
    const errorRate = totalCommands > 0 ? (stats.errors / totalCommands) * 100 : 0;
    
    if (errorRate > 5) { // More than 5% error rate
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }
    
    // Check response times
    const avgResponseTime = Object.values(stats.commands)
      .filter(cmd => cmd.count > 0)
      .reduce((sum, cmd, _, arr) => sum + cmd.avgTime / arr.length, 0);
    
    if (avgResponseTime > 5000) { // More than 5 seconds average
      issues.push(`Slow response times: ${avgResponseTime.toFixed(0)}ms avg`);
    }
    
    if (issues.length > 0) {
      console.warn('🚨 Health check issues detected:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ Health check passed - all systems nominal');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.tasks.keys()),
      taskCount: this.tasks.size
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global monitoring service instance
export let monitoringService = null;

export const initializeMonitoring = (client) => {
  if (config.features.enablePerformanceMonitoring) {
    monitoringService = new MonitoringService(client);
    monitoringService.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      if (monitoringService) {
        monitoringService.stop();
      }
    });
    
    process.on('SIGTERM', () => {
      if (monitoringService) {
        monitoringService.stop();
      }
    });
  }
};
