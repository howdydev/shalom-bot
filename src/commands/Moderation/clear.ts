import {
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { CommandType } from "../../types/command";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear messages in the current channel")
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The amount of messages you'd like cleared")
        .setMaxValue(100)
        .setMinValue(1)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
  run: async (_client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const quantity = interaction.options.getInteger("quantity", true);
    const channel = interaction.channel;
    await (channel as TextChannel).bulkDelete(quantity ?? 1);
    await interaction.editReply({
      content: `Successfully removed ${quantity} message(s)`,
    });
  },
};
