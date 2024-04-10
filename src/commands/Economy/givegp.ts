import { SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("givegp")
    .setDescription("Give a user some GP")
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
    ),
  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      const member = client.members.getMemberData(target.id);
      if (!member)
        return await interaction.editReply(
          `I could not give <:gp:1171046821137760309> ${formatNumber(
            amount
          )} to <@${target.id}>. Maybe they've not registered?`
        );

      const success = await client.members.removeGP(
        interaction.user.id,
        amount
      );

      if (!success)
        return await interaction.editReply(
          `I could not give <:gp:1171046821137760309> ${formatNumber(
            amount
          )} to <@${target.id}>. You do not have enough GP for this.`
        );

      await client.members.addGP(target.id, amount);

      await interaction.editReply(
        `I have successfully given <@${
          target.id
        }> <:gp:1171046821137760309> ${formatNumber(
          amount
        )}. Your balance is now <:gp:1171046821137760309> ${formatNumber(
          +success
        )}`
      );

      //   dm user with gp given
      await target.send(
        `You have been given <:gp:1171046821137760309> ${formatNumber(
          amount
        )} by <@${
          interaction.user.id
        }>. Your balance is now <:gp:1171046821137760309> ${formatNumber(
          member.gp + amount
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
