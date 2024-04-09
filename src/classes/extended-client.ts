import {
  Client,
  IntentsBitField,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
  TextBasedChannel,
} from "discord.js";
import path, { join } from "path";
import { CommandType } from "../types/command";
import { Event as EventType } from "../types/event";
import { readdirSync } from "fs";
import Kick from "./kick";
import { PrismaClient, User } from "@prisma/client";
import Members from "./members";
import Deathmatch from "./deathmatch";
import { DeathmatchType } from "../types/deathmatch";
import { v4 as uuidv4 } from "uuid";
import TriviaGenerator from "./trivia";
import config from "../config";

export default class ExtendedClient extends Client {
  public readonly commands = new Collection<string, CommandType>();
  public readonly kick = new Kick(this);
  public readonly database = new PrismaClient();
  public readonly members: Members;
  public readonly trivia: TriviaGenerator;

  private deathmatches: DeathmatchType[] = [];

  constructor() {
    super({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessageTyping,
      ],
      allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: false,
      },
    });

    this.trivia = new TriviaGenerator(this);
    this.members = new Members(this);
  }

  public async init(): Promise<void> {
    await this.database.$connect();

    this.login().then(async () => {
      try {
        await this.loadCommands();
        this.loadEvents();

        config.triviaEnabled && this.trivia.init();
        config.kickWatchEnabled && this.kick.init();
      } catch (error) {
        console.error(`Error in init: ${error}`);
      }
    });
  }

  public async deathmatchChallenge(
    channel: TextBasedChannel,
    challengerId: string,
    challengedId: string,
    bet: number
  ): Promise<boolean | string> {
    if (this.hasDeathmatch(challengerId))
      return "You already have a deathmatch";
    if (this.hasDeathmatch(challengedId))
      return "The challenged player already has a deathmatch";

    const challenger = this.members.getMemberData(String(challengerId).trim());
    const challenged = this.members.getMemberData(String(challengedId).trim());

    if (!challenger || !challenged) return "Could not locate member data";

    const deathmatch = new Deathmatch(this, challengerId, challengedId, bet);
    const uuid = uuidv4();

    this.deathmatches.push({
      challengerId,
      challengedId,
      deathmatch,
      id: uuid,
    });

    setTimeout(() => {
      try {
        if (this.deathmatches.some((dm) => dm.id === uuid)) {
          this.deathmatches = this.deathmatches.filter((dm) => dm.id !== uuid);

          channel.send(
            `<@${challenger.discordId}> your deathmatch with <@${challenged.discordId}> has been cancelled due to inactivity.`
          );
        }
      } catch (error) {
        console.error(`Error in deathmatch timeout: ${error}`);
      }
    }, 2 * 60 * 1000);

    return true;
  }

  public async acceptDeathmatch(
    challengerId: string
  ): Promise<boolean | string | EmbedBuilder> {
    const deathmatch = this.deathmatches.find(
      (dm) => dm.challengedId === challengerId
    );

    if (!deathmatch) return false;

    const result = await deathmatch.deathmatch.start();
    this.deathmatches = this.deathmatches.filter(
      (dm) => dm.id !== deathmatch.id
    );

    console.log(this.deathmatches);

    return result;
  }

  public hasDeathmatch(playerId: string): boolean {
    return this.deathmatches.some(
      (dm) => dm.challengerId == playerId || dm.challengedId == playerId
    );
  }

  public postCommands(): ExtendedClient {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN!
    );
    console.info("Started refreshing application (/) commands.");

    if (!this.user) throw new Error("Bot is not connected.");

    try {
      rest
        .put(Routes.applicationCommands(this.user.id), {
          body: this.commands.map((c) => c.builder.toJSON()),
        })
        .then(() => {
          console.success("Successfully reloaded application (/) commands.");
        })
        .catch((err) => {
          console.error("Error pushing commands");
          console.error(err);
        });
    } catch (error) {
      console.error(error);
    }

    return this;
  }

  public async loadCommands(): Promise<ExtendedClient> {
    let loadedCommands: string[] = [];
    const commandsPath = readdirSync(path.join(__dirname, "../commands"));

    for (const dir of commandsPath) {
      const commandFiles = readdirSync(
        path.join(__dirname, `../commands/${dir}`)
      );

      for (const file of commandFiles) {
        const { command }: { command: CommandType } = await import(
          `../commands/${dir}/${file}`
        );
        command.category = dir;

        if (this.commands.get(command.builder.name))
          console.error(`Repeated command: ${command.builder.name}`);
        else {
          this.commands.set(command.builder.name, command);
          loadedCommands.push(command.builder.name);
        }
      }
    }

    console.success(
      `Loaded ${loadedCommands.length} commands: ${loadedCommands.join(", ")}`
    );

    this.postCommands();

    return this;
  }

  public loadEvents(): ExtendedClient {
    const eventsPath = join(__dirname, "..", "events");
    const eventFiles = readdirSync(eventsPath).filter((file: any) =>
      file.endsWith(".ts")
    );

    eventFiles.forEach(async (file) => {
      try {
        const { event }: { event: EventType } = await import(
          "../events/" + file
        );
        this[event.type](event.name, event.run.bind(null, this));
      } catch (error) {
        console.error(error);
      }
    });

    return this;
  }
}
