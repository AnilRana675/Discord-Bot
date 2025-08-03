import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';

export const waifuPicCommand = {
  data: new SlashCommandBuilder()
    .setName('waifu-pic')
    .setDescription('🎌 Get a random waifu picture!')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose the type of waifu picture')
        .setRequired(false)
        .addChoices(
          { name: '🌸 SFW Waifu', value: 'waifu' },
          { name: '🎭 Neko', value: 'neko' },
          { name: '😊 Shinobu', value: 'shinobu' },
          { name: '🦊 Megumin', value: 'megumin' },
          { name: '⚡ Bully', value: 'bully' },
          { name: '😤 Cuddle', value: 'cuddle' },
          { name: '😭 Cry', value: 'cry' },
          { name: '🤗 Hug', value: 'hug' },
          { name: '😘 Kiss', value: 'kiss' },
          { name: '😆 Lick', value: 'lick' },
          { name: '👋 Pat', value: 'pat' },
          { name: '😏 Smug', value: 'smug' },
          { name: '🍵 Nom', value: 'nom' },
          { name: '👊 Bonk', value: 'bonk' },
          { name: '😴 Sleep', value: 'sleep' },
          { name: '😊 Smile', value: 'smile' },
          { name: '👋 Wave', value: 'wave' },
          { name: '😊 Happy', value: 'happy' },
          { name: '🎉 Dance', value: 'dance' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category') || 'waifu';

    // Interaction already deferred in index.js for slow commands

    try {
      // Using waifu.pics API (free anime image API)
      const response = await axios.get(`https://api.waifu.pics/sfw/${category}`);
      
      if (response.data && response.data.url) {
        const embed = new EmbedBuilder()
          .setColor(0xFF69B4)
          .setTitle(`🎌 Here's your ${category} picture!`)
          .setImage(response.data.url)
          .setFooter({ 
            text: `Category: ${category} | Powered by waifu.pics`,
            iconURL: 'https://waifu.pics/favicon.ico'
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        throw new Error('No image found');
      }

    } catch (error) {
      console.error('Error fetching waifu picture:', error);
      
      // Fallback with cute error message
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Gomen nasai!')
        .setDescription(`Couldn't fetch a ${category} picture right now. The waifus are being shy! (´･ω･\`)`)
        .setFooter({ text: 'Try again later, senpai!' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
