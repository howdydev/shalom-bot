// @ts-nocheck
import kick from "api-kick";
import ExtendedClient from "./extended-client";
import { EmbedBuilder, TextChannel } from "discord.js";
import { formatDistance } from "date-fns";

const LIVE_CHANNEL_ID = "1203729151115399188";
const GUILD_ID = "1081567118715265127";
const TIME_BETWEEN_CHECKS = 60 * 1000; // 60 seconds
const WAIT = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CHANNELS_TO_CHECK = ["highhowdy"];

export default class Kick {
  private readonly client: ExtendedClient;
  private readonly liveChannels: {
    channel: string;
    messageId: string;
    createdAt: Date;
  }[];

  constructor(client: ExtendedClient) {
    this.liveChannels = [];
    this.client = client;
  }

  public async init(): Promise<void> {
    // await this.clearMessages();
    await this.performSetups();
    this.checkChannelStatus();
  }

  private async performSetups() {
    console.info("Checking for existing live channels in the database.");
    const channels = await this.client.database.liveUser.findMany();
    if (channels.length === 0) return;

    for (const channel of channels) {
      this.liveChannels.push({
        channel: channel.channel,
        messageId: channel.messageId,
        createdAt: channel.createdAt,
      });
    }

    console.success(
      `Successfully inserted ${channels.length} existing live channels`
    );
  }

  private async clearMessages() {
    const guild = await this.client.guilds.fetch(GUILD_ID);
    if (!guild) return;

    const channel = await guild.channels.fetch(LIVE_CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) return;

    await (channel as TextChannel).bulkDelete(100);
  }

  private async checkChannelStatus() {
    for (const channel of CHANNELS_TO_CHECK) {
      const isLive = await this.isLive(channel);

      if (this.isChannelRegisteredAsLive(channel) && !isLive?.livestream) {
        this.liveChannels.filter((c) => c.channel != channel);
        this.updateMessageAsOffline(channel);
        return;
      }

      if (isLive?.livestream && !this.isChannelRegisteredAsLive(channel)) {
        await this.sendLiveNotification(channel, isLive);
      }
    }

    await WAIT(TIME_BETWEEN_CHECKS);
    this.checkChannelStatus();
  }

  private async updateMessageAsOffline(userChannel: string) {
    let foundChannel = this.liveChannels.find(
      (channel) => channel.channel === userChannel
    );

    if (!foundChannel)
      return console.error(
        `Attempted to update live message of ${userChannel} but could not locate message id.`
      );

    const guild = await this.client.guilds.fetch(GUILD_ID);
    if (!guild) return;

    const channel = await guild.channels.fetch(LIVE_CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) return;

    const message = await channel.messages.fetch(foundChannel.messageId);
    if (!message)
      return console.error(
        `Attempted to update live message of ${userChannel} but the message did not exist with id ${foundChannel.messageId}`
      );

    const timeLive = formatDistance(
      foundChannel.createdAt,
      new Date(Date.now())
    );

    message.edit({
      content: `${userChannel} is now **OFFLINE**. They were live for ${timeLive}`,
      embeds: [],
    });

    await this.client.database.liveUser.deleteMany({
      where: {
        channel: userChannel,
      },
    });
  }

  private async sendLiveNotification(userChannel: string, data: any) {
    const categories = data?.livestream?.categories || [];
    const category = categories[0]?.name || "An unknown category";

    const embed = new EmbedBuilder()
      .setTitle(`${data?.livestream?.session_title || "Unknown title"}`)
      .setDescription(
        `Streaming ${category} to ${
          data?.livestream?.viewer_count || "unknown amount of"
        } viewer(s)`
      )
      .setColor("Green")
      .setTimestamp()
      .setImage(data?.livestream?.thumbnail?.url || null)
      .setURL(`https://kick.com/${userChannel}`);

    const guild = await this.client.guilds.fetch(GUILD_ID);
    if (!guild) return;

    const channel = await guild.channels.fetch(LIVE_CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) return;

    const { id } = await channel.send({
      content: `**${userChannel}** is now LIVE on Kick.`,
      embeds: [embed],
    });

    this.liveChannels.push({
      channel: userChannel,
      messageId: id,
      createdAt: Date.now(),
    });

    await this.client.database.liveUser.create({
      data: {
        channel: userChannel,
        messageId: id,
        createdAt: new Date(Date.now()),
      },
    });
  }

  private isChannelRegisteredAsLive(channel: string): boolean {
    for (const liveChannel of this.liveChannels) {
      if (liveChannel.channel === channel) return true;
    }

    return false;
  }

  async isLive(channel: string): Promise<any> {
    return await kick.getUser(channel);
  }
}
