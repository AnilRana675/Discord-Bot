#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🤖 Discord GitHub AI Bot Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    // Create a basic .env file
    const envContent = `# Environment variables
DISCORD_TOKEN=your_discord_bot_token_here
GITHUB_TOKEN=your_github_personal_access_token_here
CLIENT_ID=your_discord_application_client_id_here
GUILD_ID=your_discord_server_id_here

# GitHub AI Models Configuration
GITHUB_AI_MODEL=gpt-4o-mini
GITHUB_AI_MAX_TOKENS=1000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
  }
} else {
  console.log('⚠️  .env file already exists, skipping creation...');
}

console.log('\n📋 Setup Instructions:');
console.log('======================');

console.log('\n1. 🤖 Discord Bot Setup:');
console.log('   • Go to https://discord.com/developers/applications');
console.log('   • Create a new application');
console.log('   • Go to "Bot" section and create a bot');
console.log('   • Copy the bot token and add it to DISCORD_TOKEN in .env');
console.log('   • Copy the Application ID and add it to CLIENT_ID in .env');

console.log('\n2. 🐙 GitHub Setup:');
console.log('   • Go to https://github.com/settings/tokens');
console.log('   • Generate a new Personal Access Token');
console.log('   • Add the token to GITHUB_TOKEN in .env');
console.log('   • Make sure you have access to GitHub AI models');

console.log('\n3. 🏠 Discord Server Setup:');
console.log('   • Right-click on your Discord server');
console.log('   • Click "Copy Server ID" (Developer Mode must be enabled)');
console.log('   • Add the server ID to GUILD_ID in .env');

console.log('\n4. 🚀 Bot Permissions:');
console.log('   • In Discord Developer Portal, go to OAuth2 > URL Generator');
console.log('   • Select "bot" and "applications.commands" scopes');
console.log('   • Select "Send Messages", "Use Slash Commands" permissions');
console.log('   • Use the generated URL to invite the bot to your server');

console.log('\n5. ▶️  Running the Bot:');
console.log('   • npm start (production)');
console.log('   • npm run dev (development with auto-restart)');

console.log('\n🎉 Once configured, use /ai in Discord to interact with the bot!');
console.log('   Use /help to see all available commands.\n');

console.log('📚 Need help? Check the README.md file for detailed instructions.');
