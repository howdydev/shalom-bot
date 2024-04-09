import { EmbedBuilder, SlashCommandBuilder, User } from "discord.js";
import { CommandType } from "../../types/command";
import { XPToLevel, formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("accept-deathmatch")
    .setDescription("Challenge another player to a deathmatch"),
  run: async (client, interaction) => {
    await interaction.deferReply();
    const challenger = client.members.getMemberData(interaction.user.id);
    if (!challenger)
      return interaction.editReply(
        "Could not locate any member data on you. You may not be registered `/register`"
      );

    const result = await client.acceptDeathmatch(challenger.discordId);
    if (!result)
      return interaction.editReply(
        "You do not have a pending deathmatch challenge."
      );

    if (typeof result === "string")
      return interaction.editReply(
        `An error occurred: ${result}. Please try again later.`
      );

    return interaction.editReply({
      embeds: [result as EmbedBuilder],
    });
  },
};
