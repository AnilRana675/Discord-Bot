#!/usr/bin/env node

/**
 * External Keep-Alive Script for Render Free Plan
 * 
 * This script can be run on an external service (like GitHub Actions, Vercel, etc.)
 * to ping your Render service every 10-14 minutes to prevent it from sleeping.
 * 
 * Usage:
 * 1. Set this up as a GitHub Action (runs every 10 minutes)
 * 2. Use with a free cron service like cron-job.org
 * 3. Deploy on Vercel/Netlify as a serverless function
 */

import https from 'https';

const RENDER_URL = 'https://discord-bot-ih7w.onrender.com';
const ENDPOINTS = ['/health', '/'];

async function pingEndpoint(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      reject({
        url,
        error: err.message,
        responseTime: Date.now() - startTime,
        success: false
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject({
        url,
        error: 'Timeout',
        responseTime: Date.now() - startTime,
        success: false
      });
    });
  });
}

async function keepAlive() {
  console.log(`[${new Date().toISOString()}] Starting external keep-alive check...`);
  
  for (const endpoint of ENDPOINTS) {
    const url = `${RENDER_URL}${endpoint}`;
    
    try {
      const result = await pingEndpoint(url);
      
      if (result.success) {
        console.log(`✅ ${url} - Status: ${result.status} (${result.responseTime}ms)`);
      } else {
        console.log(`⚠️ ${url} - Status: ${result.status} (${result.responseTime}ms)`);
      }
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.error} (${error.responseTime}ms)`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`[${new Date().toISOString()}] Keep-alive check completed.\n`);
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  keepAlive().catch(console.error);
}

export default keepAlive;
