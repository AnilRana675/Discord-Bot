import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('evolution')
  .setDescription('🧬 View bot self-evolution statistics and capabilities')
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('View evolution statistics')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('capabilities')
      .setDescription('View current learned capabilities')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('history')
      .setDescription('View evolution history')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('code')
      .setDescription('View code evolution statistics')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('analyze')
      .setDescription('Trigger manual code analysis')
  );

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  // Get evolution engine instance (you'll need to pass this or make it globally accessible)
  const evolutionEngine = interaction.client.evolutionEngine;
  
  if (!evolutionEngine) {
    return interaction.reply({
      content: '❌ Evolution engine not initialized!',
      ephemeral: true
    });
  }

  try {
    switch (subcommand) {
      case 'stats':
        await showEvolutionStats(interaction, evolutionEngine);
        break;
      case 'capabilities':
        await showCapabilities(interaction, evolutionEngine);
        break;
      case 'history':
        await showEvolutionHistory(interaction, evolutionEngine);
        break;
      case 'code':
        await showCodeEvolution(interaction, interaction.client.advancedEvolution);
        break;
      case 'analyze':
        await triggerCodeAnalysis(interaction, interaction.client.advancedEvolution);
        break;
    }
  } catch (error) {
    console.error('Evolution command error:', error);
    await interaction.reply({
      content: '❌ Failed to fetch evolution data!',
      ephemeral: true
    });
  }
}

async function showEvolutionStats(interaction, evolutionEngine) {
  const stats = evolutionEngine.getEvolutionStats();
  
  const embed = new EmbedBuilder()
    .setTitle('🧬 Bot Self-Evolution Statistics')
    .setColor('#00ff88')
    .setDescription('Current learning and adaptation metrics')
    .addFields([
      {
        name: '📊 Learning Metrics',
        value: `**Total Interactions:** ${stats.totalInteractions || 0}
**Learned Patterns:** ${stats.learnedPatterns || 0}
**Success Rate:** ${((stats.successRate || 0) * 100).toFixed(1)}%
**Average Satisfaction:** ${((stats.avgSatisfaction || 0) * 100).toFixed(1)}%`,
        inline: true
      },
      {
        name: '🎯 Adaptation Status',
        value: `**Evolution Level:** ${stats.evolutionLevel || 1}
**Last Evolution:** ${stats.lastEvolution ? `<t:${Math.floor(stats.lastEvolution / 1000)}:R>` : 'Never'}
**Active Improvements:** ${stats.activeImprovements || 0}
**Pending Capabilities:** ${stats.pendingCapabilities || 0}`,
        inline: true
      },
      {
        name: '🔄 Recent Activity',
        value: `**Messages Today:** ${stats.messagesToday || 0}
**Positive Feedback:** ${stats.positiveFeedback || 0}
**Negative Feedback:** ${stats.negativeFeedback || 0}
**Learning Efficiency:** ${((stats.learningEfficiency || 0) * 100).toFixed(1)}%`,
        inline: true
      }
    ])
    .setFooter({ text: '🧬 Evolution engine continuously adapting to improve responses' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function showCapabilities(interaction, evolutionEngine) {
  const capabilities = evolutionEngine.getCurrentCapabilities();
  
  const embed = new EmbedBuilder()
    .setTitle('🧬 Current Learned Capabilities')
    .setColor('#0099ff')
    .setDescription('Capabilities evolved through user interactions');

  if (capabilities.length === 0) {
    embed.addFields([{
      name: '📝 No Capabilities Learned Yet',
      value: 'The bot is still learning! Interact more to help it evolve new capabilities.',
      inline: false
    }]);
  } else {
    capabilities.slice(0, 10).forEach((capability, index) => {
      embed.addFields([{
        name: `${index + 1}. ${capability.name}`,
        value: `**Type:** ${capability.type}
**Confidence:** ${(capability.confidence * 100).toFixed(1)}%
**Usage:** ${capability.usageCount} times
**Success Rate:** ${(capability.successRate * 100).toFixed(1)}%`,
        inline: true
      }]);
    });

    if (capabilities.length > 10) {
      embed.addFields([{
        name: '📋 Additional Capabilities',
        value: `... and ${capabilities.length - 10} more learned capabilities!`,
        inline: false
      }]);
    }
  }

  embed.setFooter({ text: '🔄 Capabilities are automatically learned from successful interactions' });

  await interaction.reply({ embeds: [embed] });
}

async function showEvolutionHistory(interaction, evolutionEngine) {
  const history = evolutionEngine.getEvolutionHistory();
  
  const embed = new EmbedBuilder()
    .setTitle('📈 Evolution History')
    .setColor('#ff6600')
    .setDescription('Recent self-evolution events and improvements');

  if (history.length === 0) {
    embed.addFields([{
      name: '📝 No Evolution Events Yet',
      value: 'The bot hasn\'t evolved yet. Keep interacting to trigger evolution!',
      inline: false
    }]);
  } else {
    const recentEvents = history.slice(-5).reverse();
    
    recentEvents.forEach((event, index) => {
      const timestamp = `<t:${Math.floor(event.timestamp / 1000)}:R>`;
      let description = '';
      
      switch (event.type) {
        case 'PROMPT_EVOLUTION':
          description = `Improved response patterns in ${event.data.length} areas`;
          break;
        case 'CAPABILITY_EVOLUTION':
          description = `Learned ${event.data.length} new capabilities`;
          break;
        case 'PATTERN_IMPROVEMENT':
          description = `Enhanced conversation patterns`;
          break;
        default:
          description = 'General evolution event';
      }

      embed.addFields([{
        name: `${getEvolutionEmoji(event.type)} ${event.type.replace('_', ' ')}`,
        value: `${description}\n**When:** ${timestamp}`,
        inline: false
      }]);
    });

    embed.addFields([{
      name: '📊 Evolution Summary',
      value: `**Total Events:** ${history.length}
**First Evolution:** ${history[0] ? `<t:${Math.floor(history[0].timestamp / 1000)}:d>` : 'N/A'}
**Most Recent:** ${history[history.length - 1] ? `<t:${Math.floor(history[history.length - 1].timestamp / 1000)}:R>` : 'N/A'}`,
      inline: false
    }]);
  }

  await interaction.reply({ embeds: [embed] });
}

function getEvolutionEmoji(type) {
  const emojis = {
    'PROMPT_EVOLUTION': '🧠',
    'CAPABILITY_EVOLUTION': '⚡',
    'PATTERN_IMPROVEMENT': '🎯',
    'LEARNING_UPDATE': '📚',
    'RESPONSE_OPTIMIZATION': '🔧'
  };
  return emojis[type] || '🔄';
}

async function showCodeEvolution(interaction, advancedEvolution) {
  if (!advancedEvolution) {
    return interaction.reply({
      content: '❌ Advanced evolution system not available!',
      ephemeral: true
    });
  }

  const stats = advancedEvolution.getAdvancedStats();
  
  const embed = new EmbedBuilder()
    .setTitle('🧬 Code Self-Evolution Statistics')
    .setColor('#ff0066')
    .setDescription('Bot\'s ability to modify and improve its own code')
    .addFields([
      {
        name: '📊 Code Evolution Metrics',
        value: `**Total Code Changes:** ${stats.totalEvolutions || 0}
**Changes Today:** ${stats.dailyChanges || 0} / ${stats.maxDailyChanges}
**Confidence Threshold:** ${(stats.confidenceThreshold * 100).toFixed(0)}%
**Last Evolution:** ${stats.lastEvolution ? `<t:${Math.floor(stats.lastEvolution / 1000)}:R>` : 'Never'}`,
        inline: true
      },
      {
        name: '🔧 Recent Code Changes',
        value: stats.codeEvolutionHistory.length > 0 
          ? stats.codeEvolutionHistory.slice(-3).map(change => 
              `• ${change.file}: ${change.description.substring(0, 50)}...`
            ).join('\n')
          : 'No code changes yet',
        inline: false
      },
      {
        name: '⚙️ Evolution Status',
        value: `**Auto-Evolution:** ${stats.dailyChanges < stats.maxDailyChanges ? '🟢 Active' : '🔴 Daily Limit Reached'}
**Safety Checks:** 🟢 Enabled
**Backup System:** 🟢 Active`,
        inline: true
      }
    ])
    .setFooter({ text: '🧬 The bot continuously analyzes and improves its own code' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function triggerCodeAnalysis(interaction, advancedEvolution) {
  if (!advancedEvolution) {
    return interaction.reply({
      content: '❌ Advanced evolution system not available!',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    console.log('[EVOLUTION] Manual code analysis triggered by', interaction.user.tag);
    
    const analysis = await advancedEvolution.analyzeCodebaseForEvolution();
    const improvements = await advancedEvolution.generateCodeImprovements(analysis);
    
    const embed = new EmbedBuilder()
      .setTitle('🔍 Code Analysis Results')
      .setColor('#00ff88')
      .setDescription('Manual code analysis completed')
      .addFields([
        {
          name: '📋 Analysis Summary',
          value: `**Files Analyzed:** ${analysis.length}
**Improvements Found:** ${improvements.length}
**High Priority:** ${improvements.filter(i => i.priority > 0.8).length}
**Ready for Auto-Apply:** ${improvements.filter(i => i.confidence > 0.85).length}`,
          inline: true
        }
      ]);

    if (improvements.length > 0) {
      const topImprovements = improvements.slice(0, 5);
      embed.addFields([{
        name: '🔧 Top Improvement Opportunities',
        value: topImprovements.map((imp, index) => 
          `${index + 1}. **${imp.fileName}** (${(imp.priority * 100).toFixed(0)}%)\n   ${imp.description}`
        ).join('\n\n'),
        inline: false
      }]);

      // Try to apply improvements automatically
      const results = await advancedEvolution.applyCodeImprovements(improvements);
      
      embed.addFields([{
        name: '⚡ Auto-Applied Changes',
        value: `**Applied:** ${results.applied} improvements
**Skipped:** ${results.skipped} (low confidence or daily limit)`,
        inline: true
      }]);
    } else {
      embed.addFields([{
        name: '✅ Code Quality',
        value: 'No significant improvements needed. Code is well-optimized!',
        inline: false
      }]);
    }

    embed.setFooter({ text: '🧬 Code analysis helps the bot evolve and improve itself' });

    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('[EVOLUTION] Manual analysis error:', error);
    await interaction.editReply({
      content: '❌ Failed to perform code analysis. Please try again later.',
    });
  }
}

// Export as a single object with both data and execute
export default { data, execute };
