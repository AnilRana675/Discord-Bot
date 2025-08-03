import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { config } from './config.js';
import { loadCommands } from './utils/helpers.js';
import { deployCommands } from './deploy-commands.js';
import { performanceMonitor } from './utils/performance.js';
import './utils/keepAlive.js'; // Auto-start keep-alive in production

// Create Express server for health checks with performance optimizations
const app = express();
const PORT = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API responses
}));
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '1mb' })); // Limit request size

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

app.get('/', (req, res) => {
  const stats = performanceMonitor.getStats();
  res.json({
    status: 'online',
    bot: client.user?.tag || 'Starting up...',
    uptime: stats.uptime,
    timestamp: new Date().toISOString(),
    message: '🎌 Anime AI Bot is running!',
    performance: {
      memory: stats.memory,
      commands: Object.keys(stats.commands).length,
      errors: stats.errors
    }
  });
});

app.get('/health', (req, res) => {
  const stats = performanceMonitor.getStats();
  const isHealthy = client.readyAt && stats.errors < 10;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    guilds: client.guilds?.cache.size || 0,
    users: client.users?.cache.size || 0,
    ping: client.ws?.ping || 0,
    commands: commands ? commands.size : 0,
    performance: stats,
    timestamp: new Date().toISOString()
  });
});

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  const stats = performanceMonitor.getStats();
  res.json(stats);
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful server shutdown
const gracefulShutdown = () => {
  console.log('🔄 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    client.destroy();
    performanceMonitor.cleanup();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Create optimized Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
  // Performance optimizations - simplified for stability
  sweepers: {
    messages: {
      interval: 300, // 5 minutes
      lifetime: 1800, // 30 minutes
    },
    users: {
      interval: 3600, // 1 hour
      filter: () => user => user.bot && user.id !== client.user?.id,
    },
  },
});

// Load commands
let commands;

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  
  // Set bot activity
  client.user.setActivity('🎌 Anime & AI Magic ✨', { type: ActivityType.Watching });
  
  // Load commands
  commands = await loadCommands();
  
  // Deploy commands if in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Deploying commands...');
    try {
      await deployCommands();
    } catch (error) {
      console.error('⚠️  Failed to deploy commands:', error.message);
      console.log('💡 Bot will still function, but you may need to deploy commands manually.');
      console.log('💡 Make sure CLIENT_ID and DISCORD_TOKEN are from the same Discord application.');
    }
  }
});

// Handle slash command interactions with performance monitoring
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const startTime = Date.now();
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    performanceMonitor.recordError(interaction.commandName);
    return;
  }

  try {
    // Defer reply for commands that might take time
    const slowCommands = ['ai', 'waifu', 'anime', 'japanese', 'chat', 'waifu-pic'];
    if (slowCommands.includes(interaction.commandName)) {
      await interaction.deferReply();
    }

    await command.execute(interaction);
    
    const executionTime = Date.now() - startTime;
    performanceMonitor.recordCommand(interaction.commandName, executionTime);
    
    console.log(`✅ Executed command: ${interaction.commandName} by ${interaction.user.tag} (${executionTime}ms)`);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    performanceMonitor.recordError(interaction.commandName);
    
    console.error(`❌ Error executing command ${interaction.commandName} (${executionTime}ms):`, error);
    
    const errorMessage = '❌ There was an error while executing this command!';
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      console.error('❌ Failed to send error message:', replyError);
    }
  }
});

// Handle errors
client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT. Gracefully shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM. Gracefully shutting down...');
  client.destroy();
  process.exit(0);
});

// Log in to Discord with your client's token
client.login(config.discord.token).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
