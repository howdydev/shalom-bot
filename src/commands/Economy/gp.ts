import { SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("gp")
    .setDescription("Check how much GP you have"),
  run: async (client, interaction) => {
    await interaction.deferReply();
    const member = client.members.getMemberData(interaction.user.id);
    console.log(interaction.user.id);
    if (!member)
      return interaction.editReply({
        content: `Could not find any member data on you. Try /register if you haven't already.`,
      });

    await interaction.editReply(
      `You have <:gp:1171046821137760309> ${formatNumber(member.gp)}`
    );
  },
};
