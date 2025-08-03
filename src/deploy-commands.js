import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { loadCommands } from './utils/helpers.js';

async function deployCommands() {
  try {
    console.log('🔄 Started refreshing application (/) commands.');

    // Load all commands
    const commands = await loadCommands();
    const commandsData = Array.from(commands.values()).map(command => command.data.toJSON());

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(config.discord.token);

    // Deploy commands globally or to a specific guild
    if (config.discord.guildId) {
      // Deploy to specific guild (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commandsData }
      );
      console.log(`✅ Successfully reloaded ${commandsData.length} application (/) commands for guild ${config.discord.guildId}.`);
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commandsData }
      );
      console.log(`✅ Successfully reloaded ${commandsData.length} application (/) commands globally.`);
    }

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands();
}

export { deployCommands };
