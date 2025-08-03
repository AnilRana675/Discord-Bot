# Keep-Alive Service for Free Hosting

## 🔄 Keeping Your Bot Online 24/7

Many free hosting services put your bot to sleep after inactivity. This script helps keep it awake.

### Option 1: Simple HTTP Health Check

Add this to your bot:

```javascript
// Add to src/index.js
import express from 'express';

// Create simple web server for health checks
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: client.user?.tag || 'Not logged in',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    ping: client.ws.ping
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
});
```

### Option 2: UptimeRobot Setup

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: Your app URL (provided by hosting service)
   - **Interval**: 5 minutes
4. UptimeRobot will ping your bot every 5 minutes

### Option 3: Cron Job (Advanced)

For Railway/Render, add this to package.json:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "keep-alive": "node scripts/keep-alive.js"
  }
}
```

Create `scripts/keep-alive.js`:

```javascript
import fetch from 'node-fetch';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function keepAlive() {
  try {
    const response = await fetch(`${APP_URL}/health`);
    const data = await response.json();
    console.log('✅ Keep-alive ping successful:', data.status);
  } catch (error) {
    console.error('❌ Keep-alive ping failed:', error.message);
  }
}

// Ping every 14 minutes (before 15-minute timeout)
setInterval(keepAlive, 14 * 60 * 1000);
keepAlive(); // Initial ping
```
