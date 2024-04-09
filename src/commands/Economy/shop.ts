import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

const shop_options = [
  {
    id: "extend-slayer-task",
    label: "Extend Slayer Task (50%)",
    description: "I will extend your current slayer task by 50%",
    price: 100000,
    value: "extend-task-50",
  },
  {
    id: "extend-slayer-task",
    label: "Extend Slayer Task (100%)",
    description: "I will extend your current slayer task by 100%",
    price: 180000,
    value: "extend-task-100",
  },
  {
    id: "skip-slayer-task",
    description:
      "I will skip your current slayer task. You will recieve no gp or xp for this task",
    label: "Skip Slayer Task",
    value: "skip-task",
    price: 75000,
  },
];

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View the shop"),
  run: async (client, interaction) => {
    const member = await client.members.getMemberData(interaction.user.id);
    if (!member) {
      return interaction.reply({
        content: "You must register before you can use the shop `/register`",
        ephemeral: true,
      });
    }

    const options: StringSelectMenuOptionBuilder[] = [];

    for (const option of shop_options) {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${option.label} (${formatNumber(option.price)})`)
          .setDescription(option.description)
          .setValue(option.value)
      );
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(interaction.id)
      .setPlaceholder("Open the shop")
      .addOptions(...options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select
    );

    const reply = await interaction.reply({
      content: "Welcome to the shop!",
      components: [row],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.user.id === interaction.user.id && i.customId === interaction.id,
    });

    collector.on("collect", async (interaction) => {
      switch (interaction?.values[0]) {
        case "extend-task-50":
          interaction.reply({
            content: "This feature is not yet implemented",
            ephemeral: true,
          });
          break;
        case "extend-task-100":
          interaction.reply({
            content: "This feature is not yet implemented",
            ephemeral: true,
          });
          break;
        case "skip-task":
          interaction.reply({
            content: "This feature is not yet implemented",
            ephemeral: true,
          });
          break;
        default:
          interaction.reply({
            content: "An unknown error occurred. Please try again later",
            ephemeral: true,
          });
          break;
      }
    });
  },
};
