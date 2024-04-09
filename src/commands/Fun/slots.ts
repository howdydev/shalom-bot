import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { SlotMachine, SlotSymbol } from "slot-machine";
import { formatNumber } from "../../utils";

const LOSING_STRINGS = [
  "Got lured into losing their GP",
  "Lost their GP",
  "Got scammed",
  "Got cleaned",
];

const quest = new SlotSymbol("quest", {
  display: "<:quest:1225161087884857496>",
  points: 1,
  weight: 100,
});
const nice = new SlotSymbol("nice", {
  display: "<:nice:1171045588469567518>",
  points: 1,
  weight: 100,
});
const duradel = new SlotSymbol("duradel", {
  display: "<:duradaddy:1171045806267183125>",
  points: 1,
  weight: 100,
});
const gp = new SlotSymbol("gp", {
  display: "<:gp:1171046821137760309>",
  points: 1,
  weight: 100,
});
const bgs = new SlotSymbol("bgs", {
  display: "<:bgs:1225161305577750548>",
  points: 1,
  weight: 100,
});
const slayer = new SlotSymbol("slayer", {
  display: "<:slayer:1225161044251508767>",
  points: 1,
  weight: 40,
});
const claws = new SlotSymbol("claws", {
  display: "<:claws:1225159956517490801>",
  points: 1,
  weight: 40,
});
const casket = new SlotSymbol("casket", {
  display: "<:casket:1225161065600651297>",
  points: 2,
  weight: 40,
});
const zuk = new SlotSymbol("zuk", {
  display: "<:zuk:1225161129882419212>",
  points: 3,
  weight: 35,
});
const scythe = new SlotSymbol("scythe", {
  display: "<:scythe:1225161439338299594>",
  points: 4,
  weight: 30,
});
const shadow = new SlotSymbol("shadow", {
  display: "<:shadow:1225161175906652221>",
  points: 5,
  weight: 25,
});
const tbow = new SlotSymbol("tbow", {
  display: "<:tbow:1225161152036733092>",
  points: 10,
  weight: 3,
});
const pickaxe = new SlotSymbol("pickaxe", {
  display: "<:pickaxe:1225161261369659534>",
  points: 40,
  weight: 5,
});

const machine = new SlotMachine(3, [
  bgs,
  quest,
  claws,
  nice,
  zuk,
  tbow,
  shadow,
  gp,
  duradel,
  casket,
  pickaxe,
  scythe,
  slayer,
]);

const cooldown = new Set();

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Play slots with your GP")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of GP to stake")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000000)
    ),
  run: async (client, interaction) => {
    await interaction.deferReply();

    if (!client.members.isReady)
      return interaction.editReply(
        "The bot is still starting up, try again in a few minutes."
      );

    if (cooldown.has(interaction.user.id))
      return interaction.editReply(
        "You are on cooldown, please try again later."
      );

    const member = client.members.getMemberData(interaction.user.id);
    if (!member)
      return interaction.editReply(
        "Could not locate any member data on you. You may not be registered `/register`"
      );

    let amount = interaction.options.getInteger("amount", true);

    if (amount < 1)
      return interaction.editReply("You must stake at least 1 GP.");

    if ((await client.members.removeGP(interaction.user.id, amount)) === false)
      return interaction.editReply(
        `You do not have enough GP to stake ${formatNumber(amount)} GP.`
      );

    cooldown.add(interaction.user.id);

    const result = machine.play();
    const winnings = result.totalPoints * amount;

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`${interaction.user.displayName}'s slot machine`)
      .setDescription(
        `${
          winnings > 0
            ? `Winner! You won ${formatNumber(winnings)} GP!`
            : `${
                LOSING_STRINGS[
                  Math.floor(Math.random() * LOSING_STRINGS.length)
                ]
              }`
        }`
      )
      .addFields(
        { name: "Stake", value: `${formatNumber(amount)} GP`, inline: true },
        { name: "Result", value: result.visualize(), inline: true }
      );

    if (winnings > 0) await client.members.addGP(interaction.user.id, winnings);

    interaction.editReply({ embeds: [embed] });

    setTimeout(() => {
      cooldown.delete(interaction.user.id);
    }, 5000);
  },
};
