import {
  ActionRowBuilder,
  ComponentType,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";

const busy: Map<string, boolean> = new Map();

const shop_options = [
  // {
  //   id: "extend-slayer-task",
  //   label: "Extend Slayer Task (50%)",
  //   description: "I will extend your current slayer task by 50%",
  //   price: 100000,
  //   value: "extend-task-50",
  // },
  // {
  //   id: "extend-slayer-task",
  //   label: "Extend Slayer Task (100%)",
  //   description: "I will extend your current slayer task by 100%",
  //   price: 180000,
  //   value: "extend-task-100",
  // },
  // {
  //   id: "skip-slayer-task",
  //   description:
  //     "I will skip your current slayer task. You will recieve no gp or xp for this task",
  //   label: "Skip Slayer Task",
  //   value: "skip-task",
  //   price: 75000,
  // },
  {
    id: "afk-slayer",
    description:
      "I will continuously give you slayer tasks one after the other",
    label: "AFK Slayer",
    value: "afk-slayer",
    price: 300000000,
  },
];

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View the shop"),
  run: async (client, interaction) => {
    const member = client.members.getMemberData(interaction.user.id);
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

    const deleteOptions = async () => {
      await reply.delete();
    };

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
        case "afk-slayer":
          const settings = client.members.getSlayerSettings(
            interaction.user.id
          );

          if (!settings) {
            interaction.reply({
              content:
                "Could not find any settings for your profile, please try again later.",
              ephemeral: true,
            });
            await deleteOptions();
            break;
          }

          if (settings.afkSlayer) {
            interaction.reply({
              content: "You have already purchased this from me",
              ephemeral: true,
            });
            await deleteOptions();
            break;
          }

          busy.set(interaction.user.id, true);
          if (
            !(await client.members.removeGP(interaction.user.id, 300000000))
          ) {
            interaction.reply({
              content: "You do not have enough GP to purchase this",
              ephemeral: true,
            });
            busy.set(interaction.user.id, false);
            await deleteOptions();
            break;
          }

          busy.set(interaction.user.id, true);
          const result = await client.members.setSlayerSettings(
            member.discordId,
            {
              afkSlayer: true,
            }
          );

          if (!result) {
            interaction.reply({
              content:
                "I was unable to purchase this for you, please try back later or report the problem.",
              ephemeral: true,
            });

            await client.members.addGP(member.discordId, 300000000);
          } else {
            interaction.reply({
              content:
                "Purchase successful. I will now reassign you slayer tasks as soon as they've been completed.",
              ephemeral: true,
            });
          }

          busy.set(interaction.user.id, false);
          await deleteOptions();
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
