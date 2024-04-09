import {
  GuildMember,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  User,
} from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("adminsetgp")
    .setDescription("Give a user some GP (Admin only)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you'd like to give GP to")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of GP you wish to give to the user")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const target = interaction.options.getUser("user", true) as User;
      const amount = interaction.options.getInteger("amount", true);
      const success = await client.members.addGP(target.id, amount);

      if (!success)
        return await interaction.editReply(
          `I could not give <:gp:1171046821137760309> ${formatNumber(
            amount
          )} to <@${target.id}>. Maybe they've not registered?`
        );

      return await interaction.editReply(
        `I have successfully given <@${
          target.id
        }> <:gp:1171046821137760309> ${formatNumber(
          amount
        )}. Their balance is now <:gp:1171046821137760309> ${formatNumber(
          +success
        )}`
      );
    } catch (error) {
      await interaction.editReply(
        "An unknown error occurred. Please try again later"
      );
      console.error("Error adding GP to user from /givegp", error);
    }
  },
};
