import { EmbedBuilder } from "discord.js";
import ExtendedClient from "./extended-client";

export default class Deathmatch {
  public readonly client: ExtendedClient;
  public inProgress: boolean;
  public challengerId: string;
  public challengedId: string;
  public bet: number;
  public startBy: Date;

  constructor(
    client: ExtendedClient,
    challengerId: string,
    challengedId: string,
    bet: number
  ) {
    this.client = client;
    this.inProgress = false;
    this.challengerId = challengerId;
    this.challengedId = challengedId;
    this.bet = bet;
    this.startBy = new Date(Date.now() + 1000 * 60 * 5);
  }

  public async start(): Promise<false | string | EmbedBuilder> {
    if (this.inProgress) return false;

    this.inProgress = true;

    const challenger = this.client.members.getMemberData(
      String(this.challengerId)
    );
    const challenged = this.client.members.getMemberData(
      String(this.challengedId)
    );

    if (!challenger || !challenged) {
      this.inProgress = false;
      return false;
    }

    if (challenger.gp < this.bet || challenged.gp < this.bet) {
      this.inProgress = false;
      return false;
    }

    await this.client.members.removeGP(String(this.challengerId), this.bet);
    await this.client.members.removeGP(String(this.challengedId), this.bet);

    return await this.battle();
  }

  public async battle(): Promise<string | EmbedBuilder> {
    let challengerHp = 99;
    let challengedHp = 99;

    const challenger = this.client.members.getMemberData(
      String(this.challengerId)
    )!;

    const challenged = this.client.members.getMemberData(
      String(this.challengedId)
    )!;

    if (!challenger || !challenged) {
      await this.client.members.addGP(String(this.challengerId), this.bet);
      await this.client.members.addGP(String(this.challengedId), this.bet);
      return "Challenge failed, refunding gp.";
    }

    while (challengerHp > 0 && challengedHp > 0) {
      challengerHp -= Math.floor(Math.random() * 10);
      if (challengerHp <= 0) break;
      challengedHp -= Math.floor(Math.random() * 10);
      if (challengedHp <= 0) break;
    }

    if (challengerHp > challengedHp) {
      await this.client.members.addGP(String(this.challengerId), this.bet * 2);
    } else {
      await this.client.members.addGP(String(this.challengedId), this.bet * 2);
    }

    const embed = new EmbedBuilder()
      .setTitle("Deathmatch Results")
      .setDescription(
        `The deathmatch between ${challenger.rsn} and ${challenged.rsn} has concluded.`
      )
      .setThumbnail(
        "https://oldschool.runescape.wiki/images/Dharok%27s_armour_equipped_male.png?3d05c"
      )
      .addFields(
        {
          name: `${challenger.rsn}`,
          value: `<:hp:1225240946426249287> ${
            challengerHp < 0 ? 0 : challengerHp
          }`,
          inline: true,
        },
        {
          name: `${challenged.rsn}`,
          value: `<:hp:1225240946426249287> ${
            challengedHp < 0 ? 0 : challengedHp
          }`,
          inline: true,
        },
        {
          name: "Winner",
          value: `${
            challengerHp > challengedHp ? challenger.rsn : challenged.rsn
          } wins!`,
          inline: false,
        },
        {
          name: "Winnings",
          value: `<:gp:1171046821137760309> ${this.bet * 2}`,
          inline: true,
        }
      );

    return embed;
  }
}
