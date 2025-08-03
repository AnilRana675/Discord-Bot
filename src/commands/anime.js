import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const animeQuotes = [
  { quote: "「Believe it!」", character: "Naruto Uzumaki", anime: "Naruto" },
  { quote: "「I am the bone of my sword.」", character: "Archer", anime: "Fate/Stay Night" },
  { quote: "「The world isn't perfect, but it's there for us trying the best it can.」", character: "Roy Mustang", anime: "Fullmetal Alchemist" },
  { quote: "「If you don't like your destiny, don't accept it.」", character: "Naruto Uzumaki", anime: "Naruto" },
  { quote: "「Hard work is what makes dreams come true!」", character: "Rock Lee", anime: "Naruto" },
  { quote: "「People die when they are killed.」", character: "Shirou Emiya", anime: "Fate/Stay Night" },
  { quote: "「Believe in the me that believes in you!」", character: "Kamina", anime: "Tengen Toppa Gurren Lagann" },
  { quote: "「I'll take a potato chip... and eat it!」", character: "Light Yagami", anime: "Death Note" },
  { quote: "「It's over 9000!」", character: "Vegeta", anime: "Dragon Ball Z" },
  { quote: "「I want to be the very best, like no one ever was!」", character: "Ash Ketchum", anime: "Pokémon" },
  { quote: "「The cake is a lie... wait, wrong reference.」", character: "Senku Ishigami", anime: "Dr. Stone" },
  { quote: "「Plus Ultra!」", character: "All Might", anime: "My Hero Academia" },
  { quote: "「I'm not a hero because I want your approval. I do it because I want to!」", character: "Saitama", anime: "One Punch Man" },
  { quote: "「Reality is often disappointing.」", character: "Thanos", anime: "Wait... that's Marvel" }
];

const motivationalQuotes = [
  "Keep pushing forward, like Naruto never giving up! 🍃",
  "Train harder than Rock Lee! Your dedication will pay off! 💪",
  "Be as determined as Edward Elric in finding the truth! ⚡",
  "Channel your inner Saiyan and break through your limits! 🔥",
  "Like Senku says, this is exhilarating! Keep learning! 🧪",
  "Remember, even Saitama started with basic training! 👊",
  "Be the protagonist of your own anime story! ⭐",
  "Every setback is just your character development arc! 📚"
];

export const animeCommand = {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('🎌 Anime-related commands!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('quote')
        .setDescription('Get an inspirational anime quote')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('motivate')
        .setDescription('Get anime-inspired motivation')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('recommend')
        .setDescription('Get anime recommendations based on your mood')
        .addStringOption(option =>
          option.setName('mood')
            .setDescription('What kind of anime are you in the mood for?')
            .setRequired(true)
            .addChoices(
              { name: '😤 Action & Adventure', value: 'action' },
              { name: '💕 Romance & Slice of Life', value: 'romance' },
              { name: '😂 Comedy & Fun', value: 'comedy' },
              { name: '🤔 Psychological & Mystery', value: 'psychological' },
              { name: '⚔️ Fantasy & Magic', value: 'fantasy' },
              { name: '🤖 Sci-Fi & Mecha', value: 'scifi' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'quote') {
      const randomQuote = animeQuotes[Math.floor(Math.random() * animeQuotes.length)];
      
      const embed = new EmbedBuilder()
        .setColor(0xFF6B9D)
        .setTitle('🎌 Anime Quote of the Moment')
        .setDescription(`**${randomQuote.quote}**`)
        .addFields(
          { name: '👤 Character', value: randomQuote.character, inline: true },
          { name: '📺 Anime', value: randomQuote.anime, inline: true }
        )
        .setFooter({ text: 'Stay motivated, senpai! ✨' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'motivate') {
      const randomMotivation = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      
      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('⚡ Anime Motivation Power-Up!')
        .setDescription(randomMotivation)
        .setFooter({ text: 'Your main character moment starts now! 🌟' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'recommend') {
      const mood = interaction.options.getString('mood');
      
      const recommendations = {
        action: [
          "**Attack on Titan** - Epic battles against titans! ⚔️",
          "**Demon Slayer** - Beautiful animation with intense fights! 🗾", 
          "**Jujutsu Kaisen** - Modern supernatural action! 👻",
          "**One Piece** - The greatest pirate adventure ever! 🏴‍☠️",
          "**Dragon Ball Z** - Classic power-ups and epic battles! 💪"
        ],
        romance: [
          "**Your Name** - Beautiful romance across time! 💫",
          "**Toradora!** - Tsundere romance at its finest! 💕",
          "**Kaguya-sama: Love is War** - Comedy romance perfection! 💘",
          "**Weathering With You** - Romance with supernatural elements! 🌧️",
          "**Clannad** - Emotional journey guaranteed! 😭"
        ],
        comedy: [
          "**One Punch Man** - Superhero parody gold! 👊",
          "**Konosuba** - Isekai comedy masterpiece! 🎭",
          "**Gintama** - Comedy with occasional serious moments! 🍭",
          "**The Disastrous Life of Saiki K.** - Psychic high school comedy! 🔮",
          "**Nichijou** - Absurd daily life comedy! 🎪"
        ],
        psychological: [
          "**Death Note** - Mind games with a supernatural twist! 📓",
          "**Monster** - Psychological thriller masterpiece! 👹",
          "**Psycho-Pass** - Dystopian psychological sci-fi! 🧠",
          "**Serial Experiments Lain** - Deep dive into identity! 💻",
          "**Paranoia Agent** - Surreal psychological mystery! 👁️"
        ],
        fantasy: [
          "**Fullmetal Alchemist: Brotherhood** - Perfect fantasy adventure! ⚗️",
          "**Made in Abyss** - Dark fantasy exploration! 🕳️",
          "**Re:Zero** - Dark isekai with time loops! ⏰",
          "**Overlord** - Isekai from the villain's perspective! 💀",
          "**That Time I Got Reincarnated as a Slime** - Wholesome isekai! 🟢"
        ],
        scifi: [
          "**Steins;Gate** - Time travel masterpiece! ⏳",
          "**Ghost in the Shell: SAC** - Cyberpunk excellence! 🤖",
          "**Cowboy Bebop** - Space western classic! 🛸",
          "**Neon Genesis Evangelion** - Mecha with deep themes! 🤖",
          "**Dr. Stone** - Science saves the world! 🧪"
        ]
      };

      const recs = recommendations[mood];
      const selectedRecs = recs.slice(0, 3); // Show top 3

      const embed = new EmbedBuilder()
        .setColor(0x9966CC)
        .setTitle(`🎌 Anime Recommendations: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`)
        .setDescription(selectedRecs.join('\n\n'))
        .setFooter({ text: 'Happy watching, otaku! 🍿' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
