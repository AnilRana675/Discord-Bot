import { config } from './config.js';

// Function to decode Discord bot token and extract client ID
function getClientIdFromToken(token) {
  try {
    // Discord bot tokens have the format: BASE64(bot_id).random_chars.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the first part (base64 encoded bot ID)
    const botId = Buffer.from(parts[0], 'base64').toString('ascii');
    
    return botId;
  } catch (error) {
    console.error('Error decoding token:', error.message);
    return null;
  }
}

console.log('🔍 Discord Bot Token Analysis');
console.log('==============================\n');

const currentToken = config.discord.token;
const currentClientId = config.discord.clientId;

if (currentToken) {
  const extractedClientId = getClientIdFromToken(currentToken);
  
  console.log(`Current CLIENT_ID in .env: ${currentClientId}`);
  console.log(`Extracted CLIENT_ID from token: ${extractedClientId}`);
  
  if (extractedClientId) {
    if (currentClientId === extractedClientId) {
      console.log('✅ CLIENT_ID matches the token! The issue might be with bot permissions.');
    } else {
      console.log('❌ CLIENT_ID does NOT match the token!');
      console.log(`\n🔧 To fix this, update your .env file:`);
      console.log(`CLIENT_ID=${extractedClientId}`);
    }
  }
} else {
  console.log('❌ No Discord token found in environment variables.');
}

console.log('\n💡 If CLIENT_ID is correct but you still get authorization errors:');
console.log('   1. Make sure you own/manage the Discord application');
console.log('   2. Check if the bot has proper permissions in the Discord Developer Portal');
console.log('   3. Try regenerating the bot token if needed');
