import { SlashCommandBuilder, TextBasedChannel, User } from "discord.js";
import { CommandType } from "../../types/command";
import { XPToLevel, formatNumber } from "../../utils";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("deathmatch")
    .setDescription("Challenge another player to a deathmatch")
    .addUserOption((option) =>
      option
        .setName("player")
        .setDescription("The player you want to challenge")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("bet")
        .setDescription("The amount of gp you want to bet")
        .setRequired(true)
        .setMinValue(10000)
    ),
  run: async (client, interaction) => {
    const message = await interaction.deferReply();
    const challenger = client.members.getMemberData(interaction.user.id);
    if (!challenger)
      return interaction.editReply(
        "Could not locate any member data on you. You may not be registered `/register`"
      );

    const challengedUser = interaction.options.getUser("player", true) as User;

    if (challengedUser.id === interaction.user.id)
      return interaction.editReply("You cannot challenge yourself, dumbass.");

    const challenged = client.members.getMemberData(challengedUser.id);
    if (!challenged)
      return interaction.editReply(
        "Could not locate any member data on the player you mentioned."
      );

    const bet = interaction.options.getInteger("bet", true);
    if (challenger.gp < bet)
      return interaction.editReply(
        "You do not have enough gp to bet that amount."
      );

    if (challenged.gp < bet)
      return interaction.editReply(
        "The challenged player does not have enough gp to bet that amount."
      );

    const challenge = await client.deathmatchChallenge(
      interaction.channel as TextBasedChannel,
      interaction.user.id,
      challengedUser.id,
      bet
    );

    if (typeof challenge === "string")
      return interaction.editReply(
        `An error occurred: ${challenge}. Please try again later.`
      );

    return interaction.editReply(
      `<@${
        challenged.discordId
      }> you have been challenged to a deathmatch by <@${
        challenger.discordId
      }> for <:gp:1171046821137760309> ${formatNumber(
        bet
      )}. You can accept by typing \`/accept-deathmatch\` within the next 2 minutes.`
    );
  },
};
