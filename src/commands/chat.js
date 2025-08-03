import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GitHubAIService } from '../services/githubAI.js';

const aiService = new GitHubAIService();

// Store conversation contexts (in a real app, use a database)
const conversations = new Map();

export const chatCommand = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('🗣️ Start an interactive conversation with AI!')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Start the conversation with this message')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Choose conversation mode')
        .setRequired(false)
        .addChoices(
          { name: '🎭 Roleplay Chat', value: 'roleplay' },
          { name: '🎓 Learning Session', value: 'learning' },
          { name: '💡 Brainstorming', value: 'brainstorm' },
          { name: '🔍 Deep Discussion', value: 'deep' },
          { name: '😄 Casual Chat', value: 'casual' },
          { name: '🤖 Tech Talk', value: 'tech' }
        )
    ),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const mode = interaction.options.getString('mode') || 'casual';
    const userId = interaction.user.id;

    // Interaction already deferred in index.js for slow commands

    // Initialize conversation context
    if (!conversations.has(userId)) {
      conversations.set(userId, {
        messages: [],
        mode: mode,
        startTime: Date.now()
      });
    }

    const userConversation = conversations.get(userId);
    userConversation.messages.push({ role: 'user', content: message });

    try {
      // Mode-specific system messages
      const modePrompts = {
        roleplay: "You are an engaging roleplay partner. Adapt to any character or scenario the user wants to explore. Be creative, immersive, and maintain character consistency. Use descriptive language and emojis to enhance the experience.",
        learning: "You are a patient, encouraging teacher. Break down complex topics into understandable parts, use examples, ask follow-up questions to check understanding, and provide encouragement. Make learning fun and interactive!",
        brainstorm: "You are a creative brainstorming partner. Generate wild ideas, build on the user's thoughts, ask provocative questions, and help explore possibilities. Be enthusiastic and think outside the box! 🧠✨",
        deep: "You are a thoughtful discussion partner. Explore topics deeply, ask meaningful questions, consider multiple perspectives, and encourage critical thinking. Be philosophical and intellectually engaging.",
        casual: "You are a friendly, casual conversation partner. Be relaxed, fun, and engaging. Use emojis, share interesting thoughts, and keep the conversation flowing naturally like talking to a good friend!",
        tech: "You are a tech-savvy conversation partner. Discuss technology, programming, innovations, and digital trends. Be knowledgeable but accessible, and always ready to dive into technical details or explain concepts clearly."
      };

      const systemMessage = modePrompts[mode] + " Keep responses conversational and engaging. This is an ongoing chat, so reference previous messages when relevant.";
      
      // Create conversation context
      const conversationHistory = [
        { role: 'system', content: systemMessage },
        ...userConversation.messages.slice(-5) // Keep last 5 messages for context
      ];

      const response = await aiService.generateResponse(message, systemMessage);
      userConversation.messages.push({ role: 'assistant', content: response });

      // Create interactive embed
      const embed = new EmbedBuilder()
        .setColor(this.getModeColor(mode))
        .setTitle(`${this.getModeEmoji(mode)} Interactive Chat - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`)
        .setDescription(response)
        .addFields(
          { name: '💬 Conversation Length', value: `${userConversation.messages.length} messages`, inline: true },
          { name: '⏱️ Session Time', value: this.getSessionTime(userConversation.startTime), inline: true },
          { name: '🎯 Mode', value: mode.charAt(0).toUpperCase() + mode.slice(1), inline: true }
        )
        .setFooter({ text: 'Click buttons below to continue the conversation!' })
        .setTimestamp();

      // Create interactive buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`continue_${userId}`)
            .setLabel('Continue Chat')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💬'),
          new ButtonBuilder()
            .setCustomId(`topic_${userId}`)
            .setLabel('Change Topic')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄'),
          new ButtonBuilder()
            .setCustomId(`end_chat_${userId}`)
            .setLabel('End Chat')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛑')
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

      // Set up button interaction collector
      const filter = (buttonInteraction) => {
        return buttonInteraction.user.id === userId && 
               buttonInteraction.customId.endsWith(`_${userId}`);
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.customId === `continue_${userId}`) {
          await buttonInteraction.reply({ 
            content: '💬 What would you like to talk about next? Just type your message!',
            ephemeral: true 
          });
        } else if (buttonInteraction.customId === `topic_${userId}`) {
          await buttonInteraction.reply({ 
            content: '🔄 Great! What new topic would you like to explore? Just send a new message!',
            ephemeral: true 
          });
        } else if (buttonInteraction.customId === `end_chat_${userId}`) {
          conversations.delete(userId);
          await buttonInteraction.update({ 
            content: '👋 Chat session ended! Thanks for the conversation!',
            embeds: [],
            components: [] 
          });
          collector.stop();
        }
      });

      collector.on('end', () => {
        // Clean up old conversations after timeout
        if (conversations.has(userId)) {
          const conv = conversations.get(userId);
          if (Date.now() - conv.startTime > 300000) { // 5 minutes
            conversations.delete(userId);
          }
        }
      });

    } catch (error) {
      console.error('Error in chat command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Chat Error')
        .setDescription('Sorry, there was an error starting the chat session.')
        .addFields({ name: 'Error', value: error.message, inline: false })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  getModeColor(mode) {
    const colors = {
      roleplay: 0x9B59B6,
      learning: 0x3498DB,
      brainstorm: 0xF39C12,
      deep: 0x2C3E50,
      casual: 0x1ABC9C,
      tech: 0x34495E
    };
    return colors[mode] || 0x95A5A6;
  },

  getModeEmoji(mode) {
    const emojis = {
      roleplay: '🎭',
      learning: '🎓',
      brainstorm: '💡',
      deep: '🔍',
      casual: '😄',
      tech: '🤖'
    };
    return emojis[mode] || '💬';
  },

  getSessionTime(startTime) {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
};
