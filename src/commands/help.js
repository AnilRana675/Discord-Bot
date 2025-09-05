import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Get help and see all available commands')
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Get help for a specific category')
      .addChoices(
        { name: '🤖 AI & Chat', value: 'ai' },
        { name: '🎫 Support System', value: 'support' },
        { name: '👤 Profile & Personalization', value: 'profile' },
        { name: '🎌 Anime & Fun', value: 'anime' },
        { name: '⚙️ General Commands', value: 'general' }
      ));

async function execute(interaction) {
  const category = interaction.options.getString('category');

  if (!category) {
    // Show main help embed
    const helpEmbed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🤖 **Shelly - Your Intelligent AI Assistant**')
      .setDescription('I\'m an advanced AI bot with memory, emotional intelligence, and personalization features!')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        {
          name: '🧠 **Intelligence Features**',
          value: '• **Memory**: I remember our conversations\n• **Emotion Detection**: I understand your mood\n• **Personalization**: Tailored responses based on your interests\n• **Context Awareness**: Smart, relevant replies',
          inline: false
        },
        {
          name: '💬 **Smart Chat**',
          value: 'Just talk to me in the dedicated chat channel! I\'ll:\n• Remember our conversation history\n• Adapt to your mood and interests\n• Provide contextual responses\n• Learn your preferences over time',
          inline: false
        },
        {
          name: '📋 **Command Categories**',
          value: '🤖 **AI & Chat** - Advanced AI interactions\n🎫 **Support** - Ticket system for help\n👤 **Profile** - Personalization settings\n🎌 **Anime** - Anime and fun commands\n⚙️ **General** - Utility commands',
          inline: false
        },
        {
          name: '🎯 **Quick Start**',
          value: '1. Set up your profile: `/profile set`\n2. Chat with me in the dedicated channel\n3. Use `/help [category]` for specific help\n4. Create support tickets: `/ticket`',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Use /help [category] for detailed command lists • Made with 💖', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed] });
    return;
  }

  // Category-specific help
  const categoryEmbeds = {
    ai: new EmbedBuilder()
      .setColor('#00D4AA')
      .setTitle('🤖 **AI & Chat Commands**')
      .setDescription('Advanced AI features for intelligent conversations')
      .addFields(
        {
          name: '💬 **Smart Chat**',
          value: '• **Dedicated Channel**: Chat naturally in the bot channel\n• **Context Memory**: I remember our conversation\n• **Emotion AI**: I detect and respond to your emotions\n• **Interest Matching**: Responses based on your interests',
          inline: false
        },
        {
          name: '🧠 **AI Features**',
          value: '• **Conversation History**: Up to 10 recent messages remembered\n• **Mood Detection**: Happy, sad, excited, confused, angry\n• **Personalized Responses**: Based on your profile\n• **Smart Suggestions**: Contextual follow-up questions',
          inline: false
        }
      ),

    support: new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🎫 **Support System**')
      .setDescription('Advanced ticket system for getting help')
      .addFields(
        {
          name: '🎫 **Ticket Commands**',
          value: '`/ticket` - Create a support ticket with categories\n• **Categories**: General, Technical, Bug Report, Feature Request\n• **AI Assistant**: Get instant AI help in tickets\n• **Staff Access**: Automatic staff notifications',
          inline: false
        }
      ),

    profile: new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('👤 **Profile & Personalization**')
      .setDescription('Customize your AI experience')
      .addFields(
        {
          name: '👤 **Profile Commands**',
          value: '`/profile set` - Set your preferences\n`/profile view` - View current profile\n`/profile clear` - Reset profile data',
          inline: false
        }
      ),

    anime: new EmbedBuilder()
      .setColor('#FFB6C1')
      .setTitle('🎌 **Anime & Fun Commands**')
      .setDescription('Otaku features and entertainment')
      .addFields(
        {
          name: '🎌 **Anime Commands**',
          value: '`/waifu` - AI-generated waifu chat\n`/waifu-pic` - Random waifu images\n`/anime` - Anime information and search',
          inline: false
        }
      ),

    general: new EmbedBuilder()
      .setColor('#95A5A6')
      .setTitle('⚙️ **General Commands**')
      .setDescription('Utility and system commands')
      .addFields(
        {
          name: '📋 **Utility Commands**',
          value: '`/help` - This help system\n`/help [category]` - Category-specific help',
          inline: false
        }
      )
  };

  const embed = categoryEmbeds[category];
  if (embed) {
    embed.setFooter({ 
      text: 'Need more help? Create a support ticket with /ticket', 
      iconURL: interaction.client.user.displayAvatarURL() 
    })
    .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: '❌ Unknown category. Use `/help` to see all available categories.',
      ephemeral: true
    });
  }
}

export { data, execute };

// Also export as a single object for compatibility
export default { data, execute };
