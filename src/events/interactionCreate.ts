import { EmbedBuilder, Events, Interaction } from "discord.js";
import { Event as EventType } from "../types/event";
import ExtendedClient from "../classes/extended-client";
import { isAsyncFunction } from "util/types";
import config from "../config";

export const event: EventType = {
  name: Events.InteractionCreate,
  type: "on",
  run: async (client: ExtendedClient, interaction: Interaction) => {
    if (!interaction.isCommand() || !interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const errorHandler = (err: Error) => {
      console.error(err);

      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              ":x: **|** An error occurred while executing this command."
            ),
        ],
        ephemeral: true,
      });
    };

    if (isAsyncFunction(command.run)) {
      command.run(client, interaction).catch(errorHandler);
    } else {
      try {
        command.run(client, interaction);
      } catch (error) {
        errorHandler(error as Error);
      }
    }
  },
};
