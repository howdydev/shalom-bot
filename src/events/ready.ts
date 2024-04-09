import { Events, Interaction } from "discord.js";
import { Event as EventType } from "../types/event";
import ExtendedClient from "../classes/extended-client";

export const event: EventType = {
  name: Events.ClientReady,
  type: "on",
  run: async (client: ExtendedClient, interaction: Interaction) => {
    console.success(`${client.user?.tag} is online!`);
    // TODO: Set bots presence
  },
};
