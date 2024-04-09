import { ClientEvents } from "discord.js";
import ExtendedClient from "../classes/extended-client";

export type Event = {
  name: keyof ClientEvents;
  type: "on" | "once";
  run: (client: ExtendedClient, ...args: any) => Promise<any> | any;
};
