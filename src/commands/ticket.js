import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Open a support ticket')
  .setDMPermission(false);
// Ensure command loader compatibility
export default { data, execute };

export async function execute(interaction) {
  // Create a button for opening a ticket
  const openButton = new ButtonBuilder()
    .setCustomId('open_ticket')
    .setLabel('Open Ticket')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(openButton);

  await interaction.reply({
    content: 'Click the button below to open a support ticket.',
    components: [row],
    ephemeral: true
  });
}

export const ticketHandler = async (client) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'open_ticket') return;

    // Check if user already has a ticket
    const existing = interaction.guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.id}` && c.type === ChannelType.GuildText
    );
    if (existing) {
      await interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
      return;
    }

    // Create a private ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        // Add staff role ID here if needed
      ],
    });

    await ticketChannel.send({
      content: `<@${interaction.user.id}> Your ticket has been created! A staff member will be with you soon.\nClick the button below to close this ticket.`
    });

    await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
  });
};
