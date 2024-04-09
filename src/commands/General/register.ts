import { SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your RSN & gain access to more both features.")
    .addStringOption((option) =>
      option
        .setName("rsn")
        .setDescription("The RSN you use on OSRS")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const rsn = interaction.options.getString("rsn", true);
      const result = await client.members.registerMember(
        interaction.user.id,
        rsn
      );

      if (!result)
        return await interaction.editReply(
          `I could not register you as a member. Are you sure this RSN isn't registered to another person or that you've already registered?`
        );

      return await interaction.editReply(
        `I've successfully registered you to our database under the RSN **${rsn}**`
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "An unknown error has occured. Please try again later.",
      });
    }
  },
};
