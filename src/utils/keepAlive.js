// Keep-alive script for Render deployment
// This script helps prevent the bot from sleeping on free tier

import http from 'http';
import https from 'https';

class RenderKeepAlive {
  constructor(appUrl, interval = 14 * 60 * 1000) { // 14 minutes for Render free plan
    this.appUrl = appUrl;
    this.interval = interval;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Keep-alive already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting keep-alive pings to ${this.appUrl} every ${this.interval/1000/60} minutes`);
    
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
    console.log('🛑 Keep-alive stopped');
  }

  ping() {
    const healthUrl = `${this.appUrl}/health`;
    const client = this.appUrl.startsWith('https') ? https : http;
    
    const startTime = Date.now();
    
    const req = client.get(healthUrl, (res) => {
      const responseTime = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        console.log(`✅ Keep-alive ping successful (${responseTime}ms) - ${new Date().toISOString()}`);
      } else {
        console.log(`⚠️ Keep-alive ping returned status ${res.statusCode} (${responseTime}ms)`);
      }
      
      // Consume response data to free up memory
      res.on('data', () => {});
      res.on('end', () => {});
    }).on('error', (err) => {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Keep-alive ping failed (${responseTime}ms):`, err.message);
    });

    // Set timeout for the request
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('❌ Keep-alive ping timed out');
    });
  }
}

// Auto-start if running in production on Render
if (process.env.NODE_ENV === 'production' && (process.env.RENDER || process.env.RENDER_SERVICE_NAME)) {
  // Use the provided Render URL or construct from environment
  const appUrl = process.env.RENDER_EXTERNAL_URL || 
                 process.env.RENDER_SERVICE_URL ||
                 `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` ||
                 'https://discord-bot-ih7w.onrender.com'; // Fallback to your specific URL
  
  console.log(`🔄 Initializing keep-alive for: ${appUrl}`);
  
  const keepAlive = new RenderKeepAlive(appUrl);
  keepAlive.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Shutting down keep-alive...');
    keepAlive.stop();
  });
  
  process.on('SIGINT', () => {
    console.log('🔄 Shutting down keep-alive...');
    keepAlive.stop();
    process.exit(0);
  });
}

export default RenderKeepAlive;
