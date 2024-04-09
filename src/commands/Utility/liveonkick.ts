import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("liveonkick")
    .setDescription("Check if a user is currently live on Kick")
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("The users kick channel")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });
    const channel = interaction.options.getString("channel", true).trim();
    const isLive = await client.kick.isLive(channel);

    if (!isLive)
      return await interaction.editReply(
        `An error occurred while checking if ${channel} is live. Are you sure the channel exists?`
      );

    if (!isLive?.livestream)
      return await interaction.editReply(`${channel} is currently offline`);

    const categories = isLive?.livestream?.categories || [];
    const category = categories[0]?.name || "Unknown category";

    const embed = new EmbedBuilder()
      .setTitle(`${isLive?.livestream?.session_title || "Unknown title"}`)
      .setDescription(
        `Streaming in ${category} to ${
          isLive?.livestream?.viewer_count || "unknown amount of"
        } viewers`
      )
      .setColor("Green")
      .setTimestamp()
      .setImage(isLive?.livestream?.thumbnail?.url || "")
      .setURL(`https://kick.com/${channel}`);

    // Send message
    await interaction.editReply({
      content: `${channel} is current live on Kick!`,
      embeds: [embed],
    });
  },
};
