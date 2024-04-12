import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";
import { XPToLevel } from "../../utils";
import { fetchTask } from "../../systems/slayer/task";
import { differenceInSeconds, format } from "date-fns";

const cooldown = new Set();

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("slayertask")
    .setDescription("Set out on a slayer task"),
  run: async (client, interaction) => {
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

    const currentTask = await client.members.getTask(interaction.user.id);
    cooldown.add(interaction.user.id);

    setTimeout(() => {
      cooldown.delete(interaction.user.id);
    }, 60000);

    if (currentTask)
      return interaction.reply({
        content: `You have already been assigned to kill x${
          currentTask.amount
        } ${currentTask.name} by ${
          currentTask.taskMaster
        }. It will be completed at <t:${Math.round(
          currentTask.finishedAt.getTime() / 1000
        )}:f>`,
        ephemeral: true,
      });

    const level = XPToLevel(member.slayerExperience);
    const task = fetchTask(level, "Duradel");

    if (!task) return interaction.editReply("Failed to fetch a task");

    const timeTaken = {
      hours: format(task.finishedAt, "HH"),
      minutes: format(task.finishedAt, "mm"),
    };

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`New slayer task`)
      .setTimestamp()
      .setThumbnail("https://oldschool.runescape.wiki/images/Duradel.png?426c8")
      .setDescription(
        `Duradel has assigned you a new slayer task. It is estimated to take you about <t:${Math.round(
          task.finishedAt.getTime() / 1000
        )}:R> to complete`
      )
      .addFields(
        { name: "Slayer Monster", value: task.name, inline: true },
        { name: "Amount", value: task.amount.toString(), inline: true },
        {
          name: "Completed At",
          value: `<t:${Math.round(task.finishedAt.getTime() / 1000)}:f>`,
          inline: true,
        },
        {
          name: "Slayer Level",
          value: `Your slayer level is currently **${level}**`,
        }
      );

    await client.members.assignSlayerTask(interaction.user.id, task);
    interaction.editReply({ embeds: [embed] });
  },
};

function formatTimeDifferenceWithWords(date1: Date, date2: Date) {
  const difference = differenceInSeconds(date1, date2);

  const hours = Math.floor(difference / 3600); // Calculate hours
  const minutes = Math.floor((difference % 3600) / 60); // Calculate minutes
  const seconds = difference % 60;

  const hourWord = hours === 1 ? "hour" : "hours";
  const minuteWord = minutes === 1 ? "minute" : "minutes";
  const secondWord = seconds === 1 ? "second" : "seconds";

  // Build the output string with conditions for including each component
  let formattedDifference = "";
  if (hours > 0) formattedDifference += `${hours} ${hourWord}, `;
  if (minutes > 0) formattedDifference += `${minutes} ${minuteWord} `;
  formattedDifference += `and ${seconds} ${secondWord}`;

  return formattedDifference.trim(); // Remove any extra space at the beginning
}
