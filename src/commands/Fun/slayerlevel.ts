import { SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { XPToLevel } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("slayerlevel")
    .setDescription("Check your current slayer level"),
  run: async (client, interaction) => {
    await interaction.deferReply();
    const member = client.members.getMemberData(interaction.user.id);
    if (!member)
      return interaction.reply(
        "Could not locate any member data on you. You may not be registered `/register`"
      );

    const level = XPToLevel(member.slayerExperience);
    await interaction.editReply(
      `Your current slayer level is **${level}** with ${member.slayerExperience.toLocaleString()} slayer experience.`
    );
  },
};
