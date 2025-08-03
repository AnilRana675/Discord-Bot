import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { performanceMonitor, responseCache, rateLimiter, connectionPool } from '../utils/performance.js';

export const performanceCommand = {
  data: new SlashCommandBuilder()
    .setName('performance')
    .setDescription('📊 View bot performance metrics and statistics')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of metrics to display')
        .setRequired(false)
        .addChoices(
          { name: '📈 General Stats', value: 'general' },
          { name: '⚡ Command Performance', value: 'commands' },
          { name: '🧠 Memory Usage', value: 'memory' },
          { name: '🚀 Cache Statistics', value: 'cache' },
          { name: '🔄 API Performance', value: 'api' }
        )
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type') || 'general';
    const stats = performanceMonitor.getStats();
    
    let embed;
    
    switch (type) {
      case 'commands':
        const commandStats = Object.entries(stats.commands)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 10)
          .map(([cmd, data]) => ({
            name: `🎯 ${cmd}`,
            value: `**${data.count}** uses • **${data.avgTime.toFixed(0)}ms** avg • **${data.errors}** errors`,
            inline: true
          }));

        embed = new EmbedBuilder()
          .setColor(0x00D4AA)
          .setTitle('⚡ Command Performance')
          .setDescription('Top 10 most used commands with performance metrics')
          .addFields(commandStats.length > 0 ? commandStats : [{ name: 'No Data', value: 'No commands executed yet', inline: false }])
          .setFooter({ text: 'Performance metrics are reset on bot restart' });
        break;

      case 'memory':
        const memUsage = process.memoryUsage();
        const memoryFields = [
          { name: '📊 RSS (Resident Set Size)', value: formatBytes(memUsage.rss), inline: true },
          { name: '🧠 Heap Used', value: formatBytes(memUsage.heapUsed), inline: true },
          { name: '📋 Heap Total', value: formatBytes(memUsage.heapTotal), inline: true },
          { name: '🔗 External', value: formatBytes(memUsage.external), inline: true },
          { name: '💾 Array Buffers', value: formatBytes(memUsage.arrayBuffers || 0), inline: true },
          { name: '📈 Heap Usage', value: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`, inline: true }
        ];

        embed = new EmbedBuilder()
          .setColor(0x9B59B6)
          .setTitle('🧠 Memory Usage')
          .setDescription('Current memory consumption breakdown')
          .addFields(memoryFields)
          .setFooter({ text: 'Memory usage updates in real-time' });
        break;

      case 'cache':
        const cacheStats = responseCache.getStats();
        const hitRate = performanceMonitor.getCacheHitRate();
        
        embed = new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle('🚀 Cache Statistics')
          .setDescription('Response caching performance metrics')
          .addFields([
            { name: '📦 Cache Size', value: `${cacheStats.size}/${cacheStats.maxSize}`, inline: true },
            { name: '🎯 Hit Rate', value: hitRate, inline: true },
            { name: '⚡ Status', value: cacheStats.size > 0 ? '🟢 Active' : '🔴 Empty', inline: true },
            { name: '💡 Cache Benefit', value: `Saved ${performanceMonitor.metrics.cacheHits} API calls`, inline: false }
          ])
          .setFooter({ text: 'Cache improves response times and reduces API usage' });
        break;

      case 'api':
        const poolStats = connectionPool.getStats();
        const limiterStats = rateLimiter.getStats();
        
        embed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle('🔄 API Performance')
          .setDescription('API calls and connection management')
          .addFields([
            { name: '📞 Total API Calls', value: stats.api.totalCalls.toString(), inline: true },
            { name: '🔗 Active Connections', value: `${poolStats.active}/${poolStats.max}`, inline: true },
            { name: '⏳ Queued Requests', value: poolStats.queued.toString(), inline: true },
            { name: '🛡️ Rate Limits Active', value: limiterStats.activeKeys.toString(), inline: true },
            { name: '📊 Total Requests Tracked', value: limiterStats.totalRequests.toString(), inline: true },
            { name: '🎯 Cache Hit Rate', value: stats.api.cacheHitRate, inline: true }
          ])
          .setFooter({ text: 'Connection pooling optimizes API performance' });
        break;

      default: // general
        const uptimeFormatted = stats.uptime;
        const totalCommands = Object.values(stats.commands).reduce((sum, cmd) => sum + cmd.count, 0);
        const avgResponseTime = Object.values(stats.commands)
          .filter(cmd => cmd.count > 0)
          .reduce((sum, cmd, _, arr) => sum + cmd.avgTime / arr.length, 0);

        embed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle('📊 Bot Performance Overview')
          .setDescription('General performance statistics and health metrics')
          .addFields([
            { name: '⏰ Uptime', value: uptimeFormatted, inline: true },
            { name: '🎯 Commands Executed', value: totalCommands.toString(), inline: true },
            { name: '⚡ Avg Response Time', value: `${avgResponseTime.toFixed(0)}ms`, inline: true },
            { name: '🧠 Memory Used', value: stats.memory.heapUsed, inline: true },
            { name: '❌ Total Errors', value: stats.errors.toString(), inline: true },
            { name: '📞 API Calls', value: stats.api.totalCalls.toString(), inline: true },
            { name: '🚀 Cache Hit Rate', value: stats.api.cacheHitRate, inline: true },
            { name: '🔋 Status', value: stats.errors < 5 ? '🟢 Excellent' : stats.errors < 10 ? '🟡 Good' : '🔴 Needs Attention', inline: true }
          ])
          .setFooter({ text: 'Performance metrics • Updated in real-time' })
          .setTimestamp();
        break;
    }

    await interaction.reply({ embeds: [embed] });
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
