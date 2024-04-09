import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import ExtendedClient from "../../classes/extended-client";
import { XPToLevel, formatNumber } from "../../utils";

const cooldown: number = Date.now();

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server's leaderboard(s)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of leaderboard you want to view")
        .setRequired(true)
        .addChoices(
          { name: "Slayer Level", value: "slayer" },
          { name: "GP", value: "gp" }
        )
    )
    .addBooleanOption((option) =>
      option
        .setName("everyone")
        .setDescription("Show everyone in the server")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: !interaction.options.getBoolean("everyone", true),
    });

    const type = interaction.options.getString("type", true);
    if (type === "slayer") {
      const leaderboard = slayerLeaderboard(client, 10);
      const embed = new EmbedBuilder()
        .setTitle("Slayer Leaderboard")
        .setDescription("Here are the top 10 slayer levels in the server")
        .addFields(
          leaderboard.map((member, index) => ({
            name: `#${index + 1} - ${member.rsn}`,
            value: `<:slayer:1225161044251508767> ${XPToLevel(
              member.slayerExperience
            )} | Experience: ${member.slayerExperience.toLocaleString()}`,
          }))
        );
      return await interaction.editReply({ embeds: [embed] });
    } else if (type === "gp") {
      const leaderboard = gpLeaderboard(client, 10);

      const embed = new EmbedBuilder()
        .setTitle("GP Leaderboard")
        .setDescription("Here are the top 10 wealthiest members in the server")
        .addFields(
          leaderboard.map((member, index) => ({
            name: `#${index + 1} - ${member.rsn}`,
            value: `<:gp:1171046821137760309> ${formatNumber(member.gp)}`,
          }))
        );
      return await interaction.editReply({ embeds: [embed] });
    }

    return await interaction.editReply("Invalid leaderboard type");
  },
};

const slayerLeaderboard = (client: ExtendedClient, limit: number) => {
  const members = client.members.getAllMembers();
  const sorted = members.sort(
    (a, b) => b.slayerExperience - a.slayerExperience
  );
  sorted.slice(0, limit);

  return sorted;
};

const gpLeaderboard = (client: ExtendedClient, limit: number) => {
  const members = client.members.getAllMembers();
  const sorted = members.sort((a, b) => b.gp - a.gp);
  sorted.slice(0, limit);
  return sorted;
};
