// Manual Keep-Alive Script for Discord Bot on Render
// Usage: node scripts/manual-keepalive.js

import https from 'https';

const BOT_URL = 'https://discord-bot-ih7w.onrender.com';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

class ManualKeepAlive {
  constructor(url, interval = PING_INTERVAL) {
    this.url = url;
    this.interval = interval;
    this.isRunning = false;
    this.intervalId = null;
    this.successCount = 0;
    this.errorCount = 0;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Keep-alive is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting manual keep-alive for: ${this.url}`);
    console.log(`⏰ Ping interval: ${this.interval / 1000 / 60} minutes`);
    console.log('📊 Press Ctrl+C to stop and see statistics\n');

    // Ping immediately
    this.ping();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    
    console.log('\n🛑 Keep-alive stopped');
    console.log(`📊 Statistics:`);
    console.log(`   ✅ Successful pings: ${this.successCount}`);
    console.log(`   ❌ Failed pings: ${this.errorCount}`);
    console.log(`   📈 Success rate: ${((this.successCount / (this.successCount + this.errorCount)) * 100).toFixed(1)}%`);
  }

  ping() {
    const healthUrl = `${this.url}/health`;
    const startTime = Date.now();
    
    https.get(healthUrl, (res) => {
      const responseTime = Date.now() - startTime;
      const timestamp = new Date().toLocaleString();
      
      if (res.statusCode === 200) {
        this.successCount++;
        console.log(`✅ [${timestamp}] Ping successful (${responseTime}ms) - Bot is alive! 🤖`);
      } else {
        this.errorCount++;
        console.log(`⚠️ [${timestamp}] Ping returned status ${res.statusCode} (${responseTime}ms)`);
      }
    }).on('error', (err) => {
      this.errorCount++;
      const responseTime = Date.now() - startTime;
      const timestamp = new Date().toLocaleString();
      console.error(`❌ [${timestamp}] Ping failed (${responseTime}ms): ${err.message}`);
    });
  }

  getStats() {
    return {
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate: ((this.successCount / (this.successCount + this.errorCount)) * 100).toFixed(1),
      isRunning: this.isRunning
    };
  }
}

// Start the keep-alive service
const keepAlive = new ManualKeepAlive(BOT_URL);
keepAlive.start();

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  keepAlive.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  keepAlive.stop();
  process.exit(1);
});

// Export for potential use as module
export default ManualKeepAlive;
