// Enhanced configuration with performance optimizations
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'CLIENT_ID', 
  'GITHUB_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

export const config = {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID, // Optional for global commands
  },

  // GitHub AI Configuration
  github: {
    token: process.env.GITHUB_TOKEN,
    apiUrl: 'https://models.inference.ai.azure.com',
    aiModel: process.env.GITHUB_AI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.GITHUB_AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.GITHUB_AI_TEMPERATURE) || 0.8,
    requestTimeout: parseInt(process.env.GITHUB_AI_TIMEOUT) || 30000,
  },

  // Performance Configuration
  performance: {
    // Cache settings
    cache: {
      maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 500,
      ttl: parseInt(process.env.CACHE_TTL) || 300000, // 5 minutes
      cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL) || 60000, // 1 minute
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 10,
      cleanupInterval: parseInt(process.env.RATE_LIMIT_CLEANUP) || 300000, // 5 minutes
    },
    
    // Connection pooling
    connectionPool: {
      maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 15,
      acquireTimeout: parseInt(process.env.ACQUIRE_TIMEOUT) || 10000,
    },
    
    // Memory monitoring
    memory: {
      monitorInterval: parseInt(process.env.MEMORY_MONITOR_INTERVAL) || 30000, // 30 seconds
      maxHeapSize: parseInt(process.env.MAX_HEAP_SIZE) || 100 * 1024 * 1024, // 100MB
      historySize: parseInt(process.env.MEMORY_HISTORY_SIZE) || 100,
    },
    
    // Request optimization
    request: {
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
      retries: parseInt(process.env.REQUEST_RETRIES) || 3,
      retryDelay: parseInt(process.env.REQUEST_RETRY_DELAY) || 1000,
    }
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: process.env.TRUST_PROXY === 'true',
    
    // Security settings
    security: {
      enableHelmet: process.env.ENABLE_HELMET !== 'false',
      enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      enableCors: process.env.ENABLE_CORS === 'true',
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '1mb',
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
    maxLogSize: process.env.MAX_LOG_SIZE || '10m',
  },

  // Development vs Production settings
  environment: {
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    deployCommands: process.env.DEPLOY_COMMANDS !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },

  // Feature flags
  features: {
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
  },

  // Anime bot specific settings
  anime: {
    personalities: [
      'gentle', 'tsundere', 'energetic', 'mysterious', 
      'sleepy', 'bookworm', 'cheerful', 'cool'
    ],
    defaultPersonality: process.env.DEFAULT_PERSONALITY || 'gentle',
    enablePersonalityRotation: process.env.ENABLE_PERSONALITY_ROTATION !== 'false',
    maxResponseLength: parseInt(process.env.MAX_RESPONSE_LENGTH) || 2000,
  }
};

// Log configuration summary in development
if (config.environment.isDevelopment) {
  console.log('🔧 Configuration loaded:');
  console.log(`  - Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  - Cache: ${config.features.enableCaching ? '✅' : '❌'}`);
  console.log(`  - Rate Limiting: ${config.features.enableRateLimit ? '✅' : '❌'}`);
  console.log(`  - Performance Monitoring: ${config.features.enablePerformanceMonitoring ? '✅' : '❌'}`);
  console.log(`  - Max Connections: ${config.performance.connectionPool.maxConnections}`);
  console.log(`  - Cache Size: ${config.performance.cache.maxSize}`);
}

export default config;
