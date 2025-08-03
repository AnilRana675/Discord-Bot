import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Check bot status and GitHub AI service connectivity'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Get bot uptime
      const uptime = process.uptime();
      const uptimeString = formatUptime(uptime);

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotal = Math.round(memoryUsage.rss / 1024 / 1024);

      // Get system info
      const nodeVersion = process.version;
      const platform = process.platform;
      const arch = process.arch;

      // Test GitHub AI service
      let githubStatus = '❌ Not Available';
      let latency = 'N/A';
      let serviceEmoji = '🔴';
      
      try {
        const { GitHubAIService } = await import('../services/githubAI.js');
        const aiService = new GitHubAIService();
        
        const startTime = Date.now();
        await aiService.generateResponse('Test connection', 'Respond with exactly: "OK"');
        const endTime = Date.now();
        
        githubStatus = '✅ Operational';
        latency = `${endTime - startTime}ms`;
        serviceEmoji = '🟢';
      } catch (error) {
        githubStatus = `❌ ${error.message.substring(0, 50)}...`;
        serviceEmoji = '🔴';
      }

      // Calculate performance score
      const pingScore = interaction.client.ws.ping < 100 ? 100 : Math.max(0, 200 - interaction.client.ws.ping);
      const memoryScore = memoryMB < 100 ? 100 : Math.max(0, 200 - memoryMB);
      const uptimeScore = Math.min(100, (uptime / 3600) * 10); // 10 points per hour, max 100
      const overallScore = Math.round((pingScore + memoryScore + uptimeScore) / 3);

      const embed = new EmbedBuilder()
        .setColor(this.getStatusColor(overallScore))
        .setTitle('📊 Anime AI Bot Status Dashboard')
        .setDescription(`${this.getStatusEmoji(overallScore)} **Overall Health: ${overallScore}/100**`)
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 128 }))
        .addFields(
          { 
            name: '🤖 Bot Information', 
            value: `**Name:** ${interaction.client.user.tag}\n**ID:** ${interaction.client.user.id}\n**Servers:** ${interaction.client.guilds.cache.size}`, 
            inline: true 
          },
          { 
            name: '⚡ Performance Metrics', 
            value: `**Uptime:** ${uptimeString}\n**Ping:** ${Math.round(interaction.client.ws.ping)}ms\n**Memory:** ${memoryMB}MB / ${memoryTotal}MB`, 
            inline: true 
          },
          { 
            name: '🐙 GitHub AI Service', 
            value: `**Status:** ${githubStatus}\n**Response Time:** ${latency}\n**Model:** gpt-4o-mini`, 
            inline: true 
          },
          { 
            name: '💻 System Information', 
            value: `**Node.js:** ${nodeVersion}\n**Platform:** ${platform} (${arch})\n**Process ID:** ${process.pid}`, 
            inline: true 
          },
          { 
            name: '📈 Performance Scores', 
            value: `**Latency:** ${this.getScoreBar(pingScore)} ${pingScore}/100\n**Memory:** ${this.getScoreBar(memoryScore)} ${memoryScore}/100\n**Uptime:** ${this.getScoreBar(uptimeScore)} ${Math.round(uptimeScore)}/100`, 
            inline: true 
          },
          { 
            name: '🎌 Anime Features', 
            value: `**Waifu Personalities:** 8 types\n**Commands Loaded:** 8\n**Languages Supported:** 10+`, 
            inline: true 
          }
        )
        .setFooter({ 
          text: `${serviceEmoji} Service Status • Last Updated`,
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        })
        .setTimestamp();

      // Add warning field if there are issues
      if (overallScore < 70) {
        embed.addFields({
          name: '⚠️ Performance Warnings',
          value: this.getWarnings(pingScore, memoryScore, uptimeScore),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in status command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Status Check Failed')
        .setDescription('Unable to retrieve complete bot status information.')
        .addFields({
          name: '🐛 Error Details',
          value: error.message || 'Unknown error occurred',
          inline: false
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },

  getStatusColor(score) {
    if (score >= 80) return 0x00FF00; // Green
    if (score >= 60) return 0xFFFF00; // Yellow
    if (score >= 40) return 0xFF8C00; // Orange
    return 0xFF0000; // Red
  },

  getStatusEmoji(score) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  },

  getScoreBar(score) {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  },

  getWarnings(pingScore, memoryScore, uptimeScore) {
    const warnings = [];
    if (pingScore < 70) warnings.push('• High latency detected');
    if (memoryScore < 70) warnings.push('• High memory usage');
    if (uptimeScore < 30) warnings.push('• Recent restart detected');
    return warnings.length > 0 ? warnings.join('\n') : 'No warnings';
  }
};

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}
