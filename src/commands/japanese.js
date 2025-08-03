import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const japaneseBasics = {
  greetings: [
    { japanese: "おはよう (Ohayou)", english: "Good morning (casual)", romaji: "ohayou" },
    { japanese: "こんにちは (Konnichiwa)", english: "Hello/Good afternoon", romaji: "konnichiwa" },
    { japanese: "こんばんは (Konbanwa)", english: "Good evening", romaji: "konbanwa" },
    { japanese: "さようなら (Sayounara)", english: "Goodbye", romaji: "sayounara" },
    { japanese: "ありがとう (Arigatou)", english: "Thank you", romaji: "arigatou" },
    { japanese: "すみません (Sumimasen)", english: "Excuse me/Sorry", romaji: "sumimasen" }
  ],
  otaku: [
    { japanese: "可愛い (Kawaii)", english: "Cute", romaji: "kawaii" },
    { japanese: "格好いい (Kakkoii)", english: "Cool/Handsome", romaji: "kakkoii" },
    { japanese: "先輩 (Senpai)", english: "Senior/Upper classman", romaji: "senpai" },
    { japanese: "後輩 (Kouhai)", english: "Junior/Lower classman", romaji: "kouhai" },
    { japanese: "やばい (Yabai)", english: "Awesome/Dangerous", romaji: "yabai" },
    { japanese: "頑張って (Ganbatte)", english: "Do your best!", romaji: "ganbatte" },
    { japanese: "お疲れ様 (Otsukaresama)", english: "Good work/Thanks for your hard work", romaji: "otsukaresama" }
  ],
  emotions: [
    { japanese: "嬉しい (Ureshii)", english: "Happy", romaji: "ureshii" },
    { japanese: "悲しい (Kanashii)", english: "Sad", romaji: "kanashii" },
    { japanese: "怒っている (Okotte iru)", english: "Angry", romaji: "okotte iru" },
    { japanese: "恥ずかしい (Hazukashii)", english: "Embarrassed", romaji: "hazukashii" },
    { japanese: "びっくり (Bikkuri)", english: "Surprised", romaji: "bikkuri" },
    { japanese: "疲れた (Tsukareta)", english: "Tired", romaji: "tsukareta" }
  ]
};

const kanjiOfTheDay = [
  { kanji: "愛", meaning: "Love", reading: "あい (ai)", strokes: 13 },
  { kanji: "夢", meaning: "Dream", reading: "ゆめ (yume)", strokes: 13 },
  { kanji: "希望", meaning: "Hope", reading: "きぼう (kibou)", strokes: "7+12" },
  { kanji: "友達", meaning: "Friend", reading: "ともだち (tomodachi)", strokes: "4+12" },
  { kanji: "勇気", meaning: "Courage", reading: "ゆうき (yuuki)", strokes: "9+7" },
  { kanji: "平和", meaning: "Peace", reading: "へいわ (heiwa)", strokes: "5+8" },
  { kanji: "自由", meaning: "Freedom", reading: "じゆう (jiyuu)", strokes: "6+5" },
  { kanji: "幸せ", meaning: "Happiness", reading: "しあわせ (shiawase)", strokes: "8+8" }
];

export const japaneseCommand = {
  data: new SlashCommandBuilder()
    .setName('japanese')
    .setDescription('🎌 Learn Japanese with your AI waifu sensei!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('basics')
        .setDescription('Learn basic Japanese phrases')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Choose a category to learn')
            .setRequired(true)
            .addChoices(
              { name: '👋 Greetings', value: 'greetings' },
              { name: '🎌 Otaku Terms', value: 'otaku' },
              { name: '😊 Emotions', value: 'emotions' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kanji')
        .setDescription('Learn kanji of the day')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quiz')
        .setDescription('Take a Japanese quiz')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Quiz type')
            .setRequired(true)
            .addChoices(
              { name: '🔤 Hiragana', value: 'hiragana' },
              { name: '🔣 Katakana', value: 'katakana' },
              { name: '💬 Basic Phrases', value: 'phrases' }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'basics') {
      const category = interaction.options.getString('category');
      const phrases = japaneseBasics[category];
      const randomPhrases = phrases.sort(() => 0.5 - Math.random()).slice(0, 5);

      const embed = new EmbedBuilder()
        .setColor(0xFF6B9D)
        .setTitle(`🎌 Japanese ${category.charAt(0).toUpperCase() + category.slice(1)} Lesson`)
        .setDescription('Here are some useful phrases, ganbatte! 💪')
        .setThumbnail('https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1ef-1f1f5.png')
        .setFooter({ text: 'Keep practicing every day! 頑張って！' })
        .setTimestamp();

      randomPhrases.forEach((phrase, index) => {
        embed.addFields({
          name: `${index + 1}. ${phrase.japanese}`,
          value: `**Meaning:** ${phrase.english}\n**Romaji:** ${phrase.romaji}`,
          inline: false
        });
      });

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'kanji') {
      const randomKanji = kanjiOfTheDay[Math.floor(Math.random() * kanjiOfTheDay.length)];

      const embed = new EmbedBuilder()
        .setColor(0x9966CC)
        .setTitle('📚 Kanji of the Day')
        .setDescription(`Learn this beautiful kanji character! ✨`)
        .addFields(
          { name: '漢字 Kanji', value: `**${randomKanji.kanji}**`, inline: true },
          { name: '意味 Meaning', value: randomKanji.meaning, inline: true },
          { name: '読み方 Reading', value: randomKanji.reading, inline: true },
          { name: '画数 Stroke Count', value: randomKanji.strokes.toString(), inline: true }
        )
        .setFooter({ text: 'Practice writing this kanji 10 times! 練習頑張って！' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'quiz') {
      const quizType = interaction.options.getString('type');
      
      // Simple quiz implementation
      const quizzes = {
        hiragana: [
          { question: 'あ', answer: 'a', options: ['a', 'i', 'u', 'e'] },
          { question: 'か', answer: 'ka', options: ['ka', 'ki', 'ku', 'ke'] },
          { question: 'さ', answer: 'sa', options: ['sa', 'shi', 'su', 'se'] }
        ],
        katakana: [
          { question: 'ア', answer: 'a', options: ['a', 'i', 'u', 'e'] },
          { question: 'カ', answer: 'ka', options: ['ka', 'ki', 'ku', 'ke'] },
          { question: 'サ', answer: 'sa', options: ['sa', 'shi', 'su', 'se'] }
        ],
        phrases: [
          { question: 'ありがとう', answer: 'Thank you', options: ['Thank you', 'Hello', 'Goodbye', 'Sorry'] },
          { question: 'すみません', answer: 'Excuse me', options: ['Thank you', 'Hello', 'Goodbye', 'Excuse me'] }
        ]
      };

      const quiz = quizzes[quizType];
      const randomQuiz = quiz[Math.floor(Math.random() * quiz.length)];

      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle(`🧠 ${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Quiz!`)
        .setDescription(`What does **${randomQuiz.question}** mean?`)
        .addFields(
          { name: '🅰️ Options', value: randomQuiz.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'), inline: false },
          { name: '💡 Hint', value: 'Think carefully, you can do it! 頑張って！', inline: false }
        )
        .setFooter({ text: `Answer: ${randomQuiz.answer} | Keep studying! 勉強頑張って！` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
