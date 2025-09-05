import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ConversationManager } from '../services/conversationManager.js';

const conversationManager = new ConversationManager();

const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Manage your AI assistant profile and preferences')
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Set your profile preferences')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Your preferred name'))
      .addStringOption(option =>
        option.setName('interests')
          .setDescription('Your interests (comma-separated)'))
      .addStringOption(option =>
        option.setName('mood')
          .setDescription('Your current mood')
          .addChoices(
            { name: 'Happy 😊', value: 'happy' },
            { name: 'Excited 🎉', value: 'excited' },
            { name: 'Chill 😌', value: 'chill' },
            { name: 'Focused 🎯', value: 'focused' },
            { name: 'Curious 🤔', value: 'curious' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View your current profile'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('clear')
      .setDescription('Clear your profile data'));

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  try {
    if (subcommand === 'set') {
      const name = interaction.options.getString('name');
      const interests = interaction.options.getString('interests');
      const mood = interaction.options.getString('mood');

      if (!name && !interests && !mood) {
        await interaction.reply({
          content: '❌ Please provide at least one preference to set (name, interests, or mood).',
          ephemeral: true
        });
        return;
      }

      // Update profile
      if (name) {
        conversationManager.updateUserProfile(userId, { name });
      }
      if (interests) {
        const interestList = interests.split(',').map(i => i.trim().toLowerCase());
        conversationManager.updateUserProfile(userId, { interests: interestList });
      }
      if (mood) {
        conversationManager.updateUserProfile(userId, { mood });
      }

      const profile = conversationManager.getUserProfile(userId);

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('✅ **Profile Updated!**')
        .setDescription('Your AI assistant will now provide more personalized responses!')
        .addFields(
          { 
            name: '👤 Name', 
            value: profile.name || 'Not set', 
            inline: true 
          },
          { 
            name: '🎯 Interests', 
            value: profile.interests.length > 0 ? profile.interests.join(', ') : 'None set', 
            inline: true 
          },
          { 
            name: '😊 Mood', 
            value: profile.mood || 'Not set', 
            inline: true 
          }
        )
        .setFooter({ text: 'Use /profile view anytime to see your profile' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (subcommand === 'view') {
      const profile = conversationManager.getUserProfile(userId);

      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('👤 **Your Profile**')
        .setDescription('Here\'s how I know you so far!')
        .addFields(
          { 
            name: '👤 Preferred Name', 
            value: profile.name || 'Not set', 
            inline: true 
          },
          { 
            name: '🎯 Interests', 
            value: profile.interests.length > 0 ? profile.interests.join(', ') : 'None detected yet', 
            inline: true 
          },
          { 
            name: '😊 Current Mood', 
            value: profile.mood || 'Not set', 
            inline: true 
          },
          {
            name: '💬 Conversation History',
            value: `${conversationManager.getConversationHistory(userId).length} messages stored`,
            inline: true
          }
        )
        .setFooter({ text: 'Use /profile set to update your preferences' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (subcommand === 'clear') {
      conversationManager.clearUserData(userId);
      
      await interaction.reply({
        content: '🗑️ **Profile Cleared!**\n\nYour profile data has been removed. You can set it up again anytime with `/profile set`.',
        ephemeral: true
      });
    }

  } catch (error) {
    console.error('Profile command error:', error);
    await interaction.reply({
      content: '❌ Sorry, there was an error managing your profile. Please try again.',
      ephemeral: true
    });
  }
}

export { data, execute };

// Also export as a single object for compatibility
export default { data, execute };
