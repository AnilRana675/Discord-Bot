import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    aiModel: process.env.GITHUB_AI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.GITHUB_AI_MAX_TOKENS) || 1000,
    apiUrl: 'https://models.inference.ai.azure.com',
  },
  bot: {
    prefix: '!',
    maxMessageLength: 2000,
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'GITHUB_TOKEN',
  'CLIENT_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
