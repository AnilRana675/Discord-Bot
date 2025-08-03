
import { GitHubAIService } from '../services/githubAI.js';
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
const STAFF_LOG_CHANNEL_ID = process.env.STAFF_LOG_CHANNEL_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Open a support ticket')
  .setDMPermission(false);
// Ensure command loader compatibility
export default { data, execute };

export async function execute(interaction) {
  // Create category select menu
  const categories = [
    { label: 'General', value: 'general', description: 'General inquiry or help' },
    { label: 'Billing', value: 'billing', description: 'Billing or payment issue' },
    { label: 'Technical', value: 'technical', description: 'Technical support' },
    { label: 'Feedback', value: 'feedback', description: 'Feedback or suggestion' },
  ];
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_category')
    .setPlaceholder('Select a ticket category...')
    .addOptions(categories.map(c => ({
      label: c.label,
      value: c.value,
      description: c.description
    })));
  const row = new ActionRowBuilder().addComponents(selectMenu);
  await interaction.reply({
    content: 'Select a category to open your support ticket:',
    components: [row],
    ephemeral: true
  });
}

export const ticketHandler = async (client) => {
  client.on('interactionCreate', async (interaction) => {
    // Handle category select
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
      const category = interaction.values[0];
      // Create a button for opening a ticket with category info
      const openButton = new ButtonBuilder()
        .setCustomId(`open_ticket_${category}`)
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(openButton);
      await interaction.update({
        content: `Category selected: **${category}**. Click below to open your ticket.`,
        components: [row],
        ephemeral: true
      });
      return;
    }
    // Handle open ticket button with category
    if (interaction.isButton() && interaction.customId.startsWith('open_ticket_')) {
      const category = interaction.customId.replace('open_ticket_', '');
      // Check if user already has a ticket
      const existing = interaction.guild.channels.cache.find(
        c => c.name.startsWith(`ticket-${interaction.user.id}`) && c.type === ChannelType.GuildText
      );
      if (existing) {
        await interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
        return;
      }
      // Create a private ticket channel with category in name and topic
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}-${category}`,
        type: ChannelType.GuildText,
        topic: `Ticket for <@${interaction.user.id}> | Category: ${category}`,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          ...(STAFF_ROLE_ID ? [{
            id: STAFF_ROLE_ID,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          }] : [])
        ],
      });
      // Add a Close Ticket button
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);
      const closeRow = new ActionRowBuilder().addComponents(closeButton);
      await ticketChannel.send({
        content: `<@${interaction.user.id}> Your ticket has been created! Please describe your issue in detail. A staff member or the AI assistant will help you soon.\nClick the button below to close this ticket when your issue is resolved.`,
        components: [closeRow]
      });
      await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
      // Listen for the user's messages in the ticket channel
      const aiService = new GitHubAIService();
      const filter = m => m.author.id === interaction.user.id;
      const collector = ticketChannel.createMessageCollector({ filter });
      collector.on('collect', async (msg) => {
        const prompt = `A user sent this message in their support ticket: "${msg.content}". Summarize the issue and suggest a solution if possible.`;
        try {
          const aiReply = await aiService.generateResponse(prompt);
          await ticketChannel.send({ content: `🤖 **AI Assistant:**\n${aiReply}` });
        } catch (err) {
          await ticketChannel.send({ content: '⚠️ AI Assistant could not generate a response right now.' });
        }
      });
      return;
    }
    // Handle Close Ticket button
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
      // Only allow the ticket creator or staff to close
      const ticketOwnerId = interaction.channel.name?.split('-')[1];
      if (interaction.user.id !== ticketOwnerId && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: 'Only the ticket creator or staff can close this ticket.', ephemeral: true });
        return;
      }
      // Log ticket before closing
      if (STAFF_LOG_CHANNEL_ID) {
        try {
          const logChannel = interaction.guild.channels.cache.get(STAFF_LOG_CHANNEL_ID);
          if (logChannel) {
            // Fetch last 50 messages (oldest first)
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const sorted = Array.from(messages.values()).reverse();
            const transcript = sorted.map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
            await logChannel.send({
              content: `📝 **Ticket closed:** ${interaction.channel.name}\n**User:** <@${ticketOwnerId}>\n\n**Transcript:**\n${transcript.substring(0, 1900)}`
            });
          }
        } catch (err) {
          // Ignore log errors
        }
      }
      await interaction.reply({ content: 'This ticket will be closed in 5 seconds.', ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
      return;
    }
  });
};
