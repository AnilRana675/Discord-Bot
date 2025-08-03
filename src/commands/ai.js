import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GitHubAIService } from '../services/githubAI.js';
import { rateLimiter, performanceMonitor } from '../utils/performance.js';

const aiService = new GitHubAIService();

// Optimized loading messages with shorter, snappier text
const loadingMessages = [
  "🤖 AI thinking...",
  "🧠 Processing...",
  "⚡ Computing...",
  "🔮 Analyzing...",
  "🚀 Generating...",
  "� Working...",
  "🎯 Crafting...",
  "🌟 Creating..."
];

// Input validation helper
const validateInput = (input, maxLength = 2000) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }
  if (input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }
  if (input.length > maxLength) {
    throw new Error(`Input too long. Maximum ${maxLength} characters allowed.`);
  }
  return input.trim();
};

// Rate limiting helper
const checkUserRateLimit = (userId) => {
  return rateLimiter.checkLimit(`ai_command_${userId}`, 10, 60000); // 10 requests per minute
};

export const aiCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('🤖 Get AI-powered responses using GitHub AI models (optimized)')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Your prompt for the AI (max 2000 chars)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Response type for optimized processing')
        .setRequired(false)
        .addChoices(
          { name: '💬 Chat', value: 'general' },
          { name: '💻 Code', value: 'code' },
          { name: '📚 Explain', value: 'explain' },
          { name: '🔍 Review', value: 'review' },
          { name: '🎯 Solve', value: 'problem' },
          { name: '📖 Learn', value: 'learn' }
        )
    )
    .addStringOption(option =>
      option.setName('language')
        .setDescription('Programming language')
        .setRequired(false)
        .addChoices(
          { name: '🟨 JavaScript', value: 'javascript' },
          { name: '🐍 Python', value: 'python' },
          { name: '☕ Java', value: 'java' },
          { name: '⚡ C++', value: 'cpp' },
          { name: '💙 TypeScript', value: 'typescript' },
          { name: '🐹 Go', value: 'go' },
          { name: '🦀 Rust', value: 'rust' },
          { name: '🐘 PHP', value: 'php' },
          { name: '🔷 C#', value: 'csharp' },
          { name: '💎 Ruby', value: 'ruby' }
        )
    ),

  async execute(interaction) {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      if (!checkUserRateLimit(interaction.user.id)) {
        const rateLimitEmbed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('⏰ Rate Limited')
          .setDescription('You\'re using AI commands too frequently! Please wait a minute before trying again.')
          .setFooter({ text: 'Rate limit: 10 requests per minute' });
        
        return await interaction.reply({ embeds: [rateLimitEmbed], ephemeral: true });
      }

      const prompt = interaction.options.getString('prompt');
      const type = interaction.options.getString('type') || 'general';
      const language = interaction.options.getString('language') || 'javascript';

      // Input validation
      try {
        validateInput(prompt, 2000);
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('❌ Invalid Input')
          .setDescription(error.message)
          .setFooter({ text: 'Please check your input and try again' });
        
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Show loading message (interaction already deferred in index.js)
      const loadingMsg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      await interaction.editReply({ content: loadingMsg });

      let response;
      let embedColor = 0x0099FF;
      let embedTitle = '🤖 AI Response';
      let embedIcon = '🤖';
      
      switch (type) {
        case 'code':
          response = await aiService.generateCodeResponse(prompt, language);
          embedColor = 0x00FF00;
          embedTitle = '💻 Code Generation Result';
          embedIcon = '💻';
          break;
        case 'explain':
          response = await aiService.generateExplanation(prompt, language);
          embedColor = 0xFFFF00;
          embedTitle = '📚 Code Explanation';
          embedIcon = '📚';
          break;
        case 'review':
          response = await aiService.generateReview(prompt, language);
          embedColor = 0xFF6600;
          embedTitle = '🔍 Code Review Report';
          embedIcon = '🔍';
          break;
        case 'problem':
          const problemPrompt = `You are a problem-solving expert. Help solve this step by step with clear explanations, examples, and actionable solutions. Use emojis and engaging formatting: ${prompt}`;
          response = await aiService.generateResponse(prompt, problemPrompt);
          embedColor = 0xFF0066;
          embedTitle = '🎯 Problem Solution';
          embedIcon = '🎯';
          break;
        case 'learn':
          const learningPrompt = `You are a friendly teacher. Create an engaging learning guide for this topic. Include examples, key concepts, and next steps. Use emojis and clear formatting: ${prompt}`;
          response = await aiService.generateResponse(prompt, learningPrompt);
          embedColor = 0x9966CC;
          embedTitle = '📖 Learning Guide';
          embedIcon = '📖';
          break;
        default:
          const generalPrompt = `You are a helpful, engaging AI assistant. Provide informative and interesting responses with appropriate emojis and clear formatting. Be conversational and friendly: ${prompt}`;
          response = await aiService.generateResponse(prompt, generalPrompt);
          embedColor = 0x00CCFF;
          embedTitle = '💬 AI Chat Response';
          embedIcon = '💬';
          break;
      }

      // Split response if too long for Discord
      if (response.length <= 4096) {
        const embed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(embedTitle)
          .setDescription(response)
          .addFields(
            { name: '🎯 Request Type', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
            { name: '📝 Prompt Length', value: `${prompt.length} characters`, inline: true }
          )
          .setFooter({ 
            text: `Powered by GitHub AI Models ${language ? `• Language: ${language}` : ''}`,
            iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
          })
          .setTimestamp();

        if (language && type !== 'general') {
          embed.addFields({ name: '🔧 Language', value: language.charAt(0).toUpperCase() + language.slice(1), inline: true });
        }

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        // Handle long responses
        const chunks = this.splitResponse(response);
        
        const firstEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`${embedTitle} (Part 1/${chunks.length})`)
          .setDescription(chunks[0])
          .addFields(
            { name: '🎯 Request Type', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
            { name: '📊 Response Parts', value: `${chunks.length} parts`, inline: true }
          )
          .setFooter({ text: 'Powered by GitHub AI Models • Long response split into parts' })
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [firstEmbed] });

        // Send remaining parts
        for (let i = 1; i < chunks.length; i++) {
          const partEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${embedTitle} (Part ${i + 1}/${chunks.length})`)
            .setDescription(chunks[i])
            .setFooter({ text: `Part ${i + 1} of ${chunks.length}` });

          await interaction.followUp({ embeds: [partEmbed] });
        }
      }

    } catch (error) {
      console.error('Error in AI command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ AI Service Error')
        .setDescription(`Oops! Something went wrong while processing your request.`)
        .addFields(
          { name: '🐛 Error Details', value: error.message || 'Unknown error occurred', inline: false },
          { name: '💡 Suggestions', value: '• Check your internet connection\n• Try a simpler prompt\n• Wait a moment and try again', inline: false }
        )
        .setFooter({ text: 'Error reported to developers' })
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [errorEmbed] });
    }
  },

  splitResponse(text, maxLength = 4096) {
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    let currentChunk = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        if (line.length > maxLength) {
          const words = line.split(' ');
          for (const word of words) {
            if (currentChunk.length + word.length + 1 > maxLength) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
            }
            currentChunk += (currentChunk ? ' ' : '') + word;
          }
        } else {
          currentChunk = line;
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
};
