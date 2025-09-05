// Ticket system
import { data as ticketData, execute as ticketExecute, ticketHandler } from './commands/ticket.js';
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

// Lightweight ping endpoint for keep-alive services
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Start server with error handling (shorter log, faster fail)
const server = app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful server shutdown (no performanceMonitor cleanup for Render free)
const gracefulShutdown = () => {
  console.log('🔄 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    client.destroy();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Create optimized Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  // Render free plan: minimal sweepers to reduce memory
  sweepers: {
    messages: {
      interval: 900, // 15 minutes
      lifetime: 900, // 15 minutes
    },
    users: {
      interval: 1800, // 30 minutes
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

  // Register ticket command if not present
  if (!commands.has('ticket')) {
    commands.set('ticket', { data: ticketData, execute: ticketExecute });
  }
  // Start ticket handler
  ticketHandler(client);
  
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
// Respond to any message in a dedicated channel (no command needed)
import { GitHubAIService } from './services/githubAI.js';
import { ConversationManager } from './services/conversationManager.js';
import { IntelligentAIService } from './services/intelligentAI.js';

const DEDICATED_CHANNEL_ID = process.env.DEDICATED_CHANNEL_ID;
const aiService = new GitHubAIService();
const conversationManager = new ConversationManager();
const intelligentAI = new IntelligentAIService(aiService, conversationManager);

// Track processed messages to prevent duplicate responses
const processedMessages = new Set();
const responseInProgress = new Set(); // Track messages currently being processed

client.on('messageCreate', async (message) => {
  console.log(`[DEBUG] messageCreate: author=${message.author.tag} (${message.author.id}), channel=${message.channel.name} (${message.channel.id}), content="${message.content}"`);
  
  if (message.author.bot) {
    console.log('[DEBUG] Ignoring message from bot.');
    return;
  }
  
  if (!DEDICATED_CHANNEL_ID) {
    console.log('[DEBUG] DEDICATED_CHANNEL_ID is not set.');
    return;
  }
  
  if (message.channel.id !== DEDICATED_CHANNEL_ID) {
    console.log(`[DEBUG] Message not in dedicated channel. Expected: ${DEDICATED_CHANNEL_ID}, got: ${message.channel.id}`);
    return;
  }

  // Prevent duplicate processing
  const messageKey = `${message.id}_${message.author.id}`;
  if (processedMessages.has(messageKey) || responseInProgress.has(messageKey)) {
    console.log('[DEBUG] Message already processed or in progress, skipping...');
    return;
  }
  
  // Mark as in progress
  responseInProgress.add(messageKey);
  processedMessages.add(messageKey);
  
  // Clean up old message IDs (keep only last 100)
  if (processedMessages.size > 100) {
    const oldEntries = Array.from(processedMessages).slice(0, -50);
    oldEntries.forEach(entry => {
      processedMessages.delete(entry);
      responseInProgress.delete(entry);
    });
  }

  try {
    console.log('[DEBUG] Processing message with intelligent AI...');
    
    // Use the intelligent AI service which handles conversation memory and emotion detection
    const aiReply = await intelligentAI.generateIntelligentResponse(
      message.content,
      message.author.id,
      {
        serverName: message.guild?.name,
        serverId: message.guild?.id,
        channelName: message.channel.name,
        channelId: message.channel.id,
        username: message.author.tag,
        userId: message.author.id
      }
    );
    
    console.log('[DEBUG] AI reply generated:', aiReply);
    await message.reply(aiReply);
    console.log('[DEBUG] Replied to message successfully with intelligent response.');
    
  } catch (err) {
    console.error('❌ Intelligent AI response error:', err);
    try {
      // Fallback to basic AI if intelligent AI fails
      const context = `This message is from the Discord server "${message.guild?.name}" (ID: ${message.guild?.id}) in the channel "${message.channel.name}" (ID: ${message.channel.id}). The user is "${message.author.tag}" (ID: ${message.author.id}).`;
      const prompt = `${context}\n\nUser message: ${message.content}\n\nReply as a friendly, helpful, and conversational Discord bot. Make your response sound natural and human, and use casual language if appropriate.`;
      
      const aiReply = await aiService.generateResponse(prompt);
      await message.reply(aiReply);
      console.log('[DEBUG] Replied with fallback AI response.');
      
    } catch (fallbackErr) {
      console.error('❌ Fallback AI response error:', fallbackErr);
      try {
        await message.reply('⚠️ Sorry, I could not generate a response right now. Please try again later!');
      } catch (replyErr) {
        console.error('[DEBUG] Failed to send error reply:', replyErr);
      }
    }
  } finally {
    // Remove from in-progress tracking
    responseInProgress.delete(messageKey);
  }
});
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

// Minimal Welcome Message: DM and system channel
client.on(Events.GuildMemberAdd, async (member) => {
  // Send DM
  try {
    await member.send(`👋 Welcome to **${member.guild.name}**! Enjoy your stay!`);
  } catch (err) {
    // Ignore DM errors (user may have DMs off)
  }
  // Send to system channel if available
  if (member.guild.systemChannel) {
    try {
      await member.guild.systemChannel.send(`👋 Welcome <@${member.id}> to the server!`);
    } catch (err) {
      // Ignore channel errors
    }
  }
});

// Log in to Discord with your client's token
client.login(config.discord.token).catch((error) => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
