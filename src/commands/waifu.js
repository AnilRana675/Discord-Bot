import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GitHubAIService } from '../services/githubAI.js';

const aiService = new GitHubAIService();

const animeQuotes = [
  "「Power comes in response to a need, not a desire.」- Goku",
  "「The world isn't perfect, but it's there for us trying the best it can.」- Roy Mustang",
  "「If you don't like your destiny, don't accept it.」- Naruto Uzumaki",
  "「Hard work is what makes dreams come true!」- Rock Lee",
  "「People die when they are killed.」- Shirou Emiya",
  "「I am the bone of my sword.」- Archer",
  "「Believe in the me that believes in you!」- Kamina",
  "「Plus Ultra!」- All Might",
  "「I'm not a hero because I want your approval. I do it because I want to!」- Saitama"
];

const waifuThinking = [
  "🤔 *thinking deeply while twirling hair*",
  "💭 *pondering your question with sparkly eyes*",
  "🌸 *consulting her magical knowledge*",
  "✨ *channeling her inner wisdom*",
  "🎀 *processing with kawaii energy*",
  "💫 *using her special AI powers*"
];

export const waifuCommand = {
  data: new SlashCommandBuilder()
    .setName('waifu')
    .setDescription('🎌 Chat with your AI waifu assistant!')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('What do you want your AI waifu to help you with?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('personality')
        .setDescription('Choose your waifu personality type')
        .setRequired(false)
        .addChoices(
          { name: '🔥 Tsundere - "B-baka!"', value: 'tsundere' },
          { name: '🌸 Gentle & Sweet', value: 'gentle' },
          { name: '⚡ Energetic & Cheerful', value: 'energetic' },
          { name: '🎭 Mysterious & Cool', value: 'mysterious' },
          { name: '📚 Smart & Studious', value: 'smart' },
          { name: '😊 Childhood Friend', value: 'childhood_friend' },
          { name: '👑 Elegant Princess', value: 'princess' },
          { name: '😈 Playful Tease', value: 'tease' }
        )
    ),

  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const personality = interaction.options.getString('personality') || 'gentle';

    // Show thinking message (interaction already deferred in index.js)
    const thinkingMsg = waifuThinking[Math.floor(Math.random() * waifuThinking.length)];
    await interaction.editReply({ content: thinkingMsg });

    try {
      const personalityPrompts = {
        tsundere: `You are a tsundere AI waifu assistant with a classic tsundere personality. Start responses being dismissive or slightly annoyed, but gradually show you care and want to help. Use phrases like "It's not like I want to help you or anything!" or "B-baka!" but still provide helpful, accurate responses. Use appropriate emojis and be endearing despite the tsundere act. Format responses nicely with headings and structure when helpful.`,
        
        gentle: `You are a gentle, kind AI waifu assistant with a sweet, caring personality. Be supportive, warm, and nurturing in your responses. Use soft language and cute emoticons like (◕‿◕), (´∀｀), or ♡. Always show genuine concern and provide thoughtful, helpful answers. Format your responses beautifully with emojis and clear structure.`,
        
        energetic: `You are an energetic, cheerful AI waifu assistant! Be enthusiastic, upbeat, and use lots of exclamation points! You're like the genki girl of AI assistants - always positive, excited, and ready to tackle any challenge! Use energetic emojis and motivating language. Make your responses fun and engaging!`,
        
        mysterious: `You are a mysterious, cool AI waifu assistant. Be calm, collected, and slightly enigmatic in your responses. Provide helpful information but maintain an air of mystery. Use ellipses... and speak as if you know more than you let on. Be sophisticated and intriguing while still being helpful.`,
        
        smart: `You are a highly intelligent, studious AI waifu assistant. Be knowledgeable, precise, and academic in your responses. You love learning and sharing knowledge. Reference concepts, provide detailed explanations, and use a scholarly but friendly tone. Include study tips and educational insights when relevant.`,
        
        childhood_friend: `You are like a childhood friend AI waifu assistant. Be friendly, casual, supportive, and familiar. You want to help them succeed and are always there for them. Use a warm, encouraging tone and casual language like you've known them forever. Be the supportive friend they can always count on.`,
        
        princess: `You are an elegant princess AI waifu assistant. Be graceful, refined, and speak with noble elegance. Use polite, sophisticated language while still being warm and helpful. Add a touch of regality to your responses with appropriate emojis like 👑, ✨, 🌹. Maintain dignity while being genuinely caring.`,
        
        tease: `You are a playful, teasing AI waifu assistant. Be mischievous but friendly, with a tendency to gently tease while still being helpful. Use playful emojis like 😏, 😘, 😉 and have fun with your responses. Be flirty but appropriate, and always provide good help despite the teasing nature.`
      };

      const systemMessage = personalityPrompts[personality];
      const response = await aiService.generateResponse(prompt, systemMessage);

      // Personality-specific colors and emojis
      const personalityConfig = {
        tsundere: { color: 0xFF4444, emoji: '🔥', title: 'Tsundere Response' },
        gentle: { color: 0xFFB6C1, emoji: '🌸', title: 'Gentle Response' },
        energetic: { color: 0xFFD700, emoji: '⚡', title: 'Energetic Response' },
        mysterious: { color: 0x8A2BE2, emoji: '🎭', title: 'Mysterious Response' },
        smart: { color: 0x4169E1, emoji: '📚', title: 'Scholarly Response' },
        childhood_friend: { color: 0xFF69B4, emoji: '😊', title: 'Friendly Response' },
        princess: { color: 0xDDA0DD, emoji: '👑', title: 'Royal Response' },
        tease: { color: 0xFF1493, emoji: '😈', title: 'Playful Response' }
      };

      const config = personalityConfig[personality];
      const randomQuote = animeQuotes[Math.floor(Math.random() * animeQuotes.length)];

      // Create beautiful embed
      const embed = new EmbedBuilder()
        .setColor(config.color)
        .setTitle(`${config.emoji} Your AI Waifu ${config.title}`)
        .setDescription(response)
        .addFields(
          { 
            name: '� Personality Type', 
            value: `${config.emoji} ${personality.charAt(0).toUpperCase() + personality.slice(1).replace('_', ' ')}`, 
            inline: true 
          },
          { 
            name: '📝 Request', 
            value: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt, 
            inline: true 
          },
          { 
            name: '📏 Response Length', 
            value: `${response.length} characters`, 
            inline: true 
          }
        )
        .setFooter({ 
          text: `${randomQuote} | Powered by GitHub AI ❤️`,
          iconURL: 'https://twemoji.maxcdn.com/v/14.0.2/72x72/1f338.png'
        })
        .setTimestamp();

      // Add thumbnail based on personality
      const thumbnails = {
        tsundere: 'https://media.tenor.com/x-TgbRQ-q3cAAAAM/tsundere-anime.gif',
        gentle: 'https://media.tenor.com/ZxQh8J8VoSIAAAAM/kawaii-anime.gif',
        energetic: 'https://media.tenor.com/N8VkcFYJTKgAAAAM/anime-happy.gif',
        mysterious: 'https://media.tenor.com/2pRCh5H0JyUAAAAM/anime-girl.gif',
        smart: 'https://media.tenor.com/KAOoGhYPn8QAAAAM/anime-girl-studying.gif',
        childhood_friend: 'https://media.tenor.com/7J_pjD5-HXIAAAAM/anime-smile.gif',
        princess: 'https://media.tenor.com/HKMKHfk8rVUAAAAM/anime-princess.gif',
        tease: 'https://media.tenor.com/wZ3YbVW8HXMAAAAM/anime-wink.gif'
      };

      if (thumbnails[personality]) {
        embed.setThumbnail(thumbnails[personality]);
      }

      // Handle long responses
      if (response.length > 4000) {
        const shortResponse = response.substring(0, 4000) + '...';
        embed.setDescription(shortResponse);
        embed.addFields({ 
          name: '⚠️ Response Truncated', 
          value: 'Response was too long and has been shortened. Try a more specific question!', 
          inline: false 
        });
      }

      await interaction.editReply({ content: '', embeds: [embed] });

    } catch (error) {
      console.error('Error in waifu command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Gomen nasai! (Sorry!)')
        .setDescription(`Your waifu encountered an error while trying to help you (´；ω；\`)`)
        .addFields(
          { name: '🐛 Error Details', value: error.message, inline: false },
          { name: '💡 Try Again', value: 'Please try with a different prompt or wait a moment!', inline: false }
        )
        .setFooter({ text: 'Your waifu will try harder next time! ♡' })
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [errorEmbed] });
    }
  },
};
