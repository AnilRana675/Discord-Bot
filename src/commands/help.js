import { SlashCommandBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📚 Show information about available commands'),

  async execute(interaction) {
    const helpEmbed = {
      color: 0xFF69B4,
      title: '🎌 Anime AI Bot - Help Menu',
      description: 'Konnichiwa! I\'m your anime-themed AI assistant powered by GitHub AI models! ✨',
      thumbnail: {
        url: 'https://media.tenor.com/images/anime-girl-wave.gif'
      },
      fields: [
        {
          name: '🤖 AI Commands',
          value: `
          **\`/ai <prompt>\`** - Get AI responses with different personalities
          **\`/waifu <prompt>\`** - Chat with your AI waifu assistant! 
          `,
          inline: false,
        },
        {
          name: '🎌 Anime Features',
          value: `
          **\`/anime quote\`** - Get inspirational anime quotes
          **\`/anime motivate\`** - Anime-inspired motivation
          **\`/anime recommend <mood>\`** - Get anime recommendations
          **\`/waifu-pic <category>\`** - Random waifu pictures (SFW)
          `,
          inline: false,
        },
        {
          name: '⚙️ Waifu Personalities',
          value: `
          • **Tsundere** - "It's not like I want to help you!"
          • **Gentle** - Sweet and caring (◕‿◕)
          • **Energetic** - Genki girl energy!
          • **Mysterious** - Cool and enigmatic...
          • **Smart** - Your studious senpai
          • **Childhood Friend** - Warm and familiar
          `,
          inline: false,
        },
        {
          name: '🛠️ Utility Commands',
          value: `
          **\`/status\`** - Check bot status
          **\`/help\`** - Show this help menu
          `,
          inline: false,
        },
        {
          name: '💡 Examples',
          value: `
          • \`/waifu prompt:Help me with coding personality:tsundere\`
          • \`/ai prompt:Explain machine learning type:code language:python\`
          • \`/anime recommend mood:action\`
          • \`/waifu-pic category:neko\`
          `,
          inline: false,
        },
        {
          name: '🔗 Links',
          value: '[GitHub Repository](https://github.com) • [Invite Bot](https://discord.com)',
          inline: false,
        },
      ],
      footer: {
        text: 'Powered by GitHub AI Models • Made with ❤️ for anime lovers',
      },
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [helpEmbed] });
  },
};
