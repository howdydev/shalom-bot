import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import ExtendedClient from "../classes/extended-client";

export type CommandType = {
  builder:
    | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
    | SlashCommandSubcommandsOnlyBuilder;
  category?: string;
  run: (
    client: ExtendedClient,
    interaction: ChatInputCommandInteraction
  ) => Promise<any> | any;
};
