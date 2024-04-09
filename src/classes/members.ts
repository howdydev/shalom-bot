import { User, SlayerTask as Task } from "@prisma/client";
import ExtendedClient from "./extended-client";
import { SlayerTask } from "../types/slayer";
import { EmbedBuilder, TextChannel } from "discord.js";
import { XPToLevel, formatNumber } from "../utils";
import config from "../config";
import { getTaskData } from "../systems/slayer/tasks";

const TIME_TO_CHECK_SLAYER_TASKS = 120 * 1000; // 2 minutes.

export default class Members {
  private readonly client: ExtendedClient; // The client used to interact with the database
  public members: User[]; // Array of all members
  public slayerTasks: Task[]; // Array of all slayer tasks
  private ready: boolean; // Flag indicating whether the members have been fetched

  /**
   * Constructor for the Members class.
   * @param client - The client used to interact with the database.
   */
  constructor(client: ExtendedClient) {
    this.client = client;
    this.members = [];
    this.slayerTasks = [];
    this.fetchMembers();
  }

  public getAllMembers(): User[] {
    return this.members;
  }

  /**
   * Fetches all members from the database.
   */
  private async fetchMembers() {
    try {
      const members = await this.client.database.user.findMany({
        include: {
          task: true,
        },
      });

      this.members = members;
      this.ready = true;

      members.forEach((member) => {
        if (member.task) this.slayerTasks.push(member.task);
      });

      setTimeout(() => {
        this.checkSlayerTasks();
      }, 10000);
    } catch (error) {
      console.error("Error fetching registered members", error);
    }
  }

  /**
   * Assigns a slayer task to a member.
   * @param discordId - The discord ID of the member.
   * @param task - The task to assign.
   * @returns A promise that resolves to a boolean indicating whether the task was assigned successfully.
   */
  public async assignSlayerTask(discordId: string, task: SlayerTask) {
    const member = this.getMemberData(discordId);
    if (!member) return false;

    await this.client.database.slayerTask.deleteMany({
      where: {
        userId: member.id,
      },
    });

    const createdTask = await this.client.database.slayerTask.create({
      data: {
        name: task.name,
        amount: +task.amount,
        experience: task.experience,
        finishedAt: task.finishedAt,
        taskMaster: task.taskMaster,
        user: {
          connect: {
            discordId,
          },
        },
        userId: member.id,
      },
    });

    this.slayerTasks.push(createdTask);

    return true;
  }

  /**
   * Checks slayer tasks of users on a cycle & posts to a select channel on completion
   */
  private async checkSlayerTasks() {
    const now = new Date();

    this.slayerTasks.forEach(async (task) => {
      try {
        if (task.finishedAt < now) {
          const user = await this.client.database.user.findFirst({
            where: {
              id: task.userId,
            },
          });

          if (!user) return;

          const member = this.getMemberData(user.discordId);
          if (!member) return;

          this.slayerTasks = this.slayerTasks.filter(
            (t) => t.userId !== task.userId
          );

          await this.client.database.slayerTask.delete({
            where: {
              id: task.id,
            },
          });

          let goldEarned = Math.floor(task.experience * 3);

          const taskData = getTaskData(task.taskMaster, task.name);

          if (taskData) {
            goldEarned = Math.floor(taskData.averageGpPerKill * task.amount);
          } else {
            console.error("Failed to find task data for slayer task", task);
          }

          await this.addGP(user.discordId, goldEarned);

          await this.client.database.user.update({
            where: {
              id: task.userId,
            },
            data: {
              slayerExperience: {
                increment: task.experience,
              },
            },
          });

          member.slayerExperience += task.experience;

          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Slayer Task Completed")
            .setTimestamp()
            .setDescription(
              `Congratulations! <@${user.discordId}> has completed their slayer task!`
            )
            .setThumbnail(
              "https://oldschool.runescape.wiki/images/Slayer_icon_%28detail%29.png"
            )
            .addFields(
              { name: "Monster", value: task.name, inline: true },
              {
                name: "Amount Slain",
                value: task.amount.toString(),
                inline: true,
              },
              {
                name: "Gold Earned",
                value: `<:gp:1171046821137760309> ${formatNumber(goldEarned)}`,
                inline: true,
              },
              {
                name: "Total Gold",
                value: `<:gp:1171046821137760309> ${formatNumber(member.gp)}`,
                inline: true,
              },
              {
                name: "Experience Gained",
                value: task.experience.toString(),
                inline: true,
              },
              {
                name: "Slayer Level",
                value: `${XPToLevel(member.slayerExperience)}`,
                inline: true,
              },
              {
                name: "Total Experience",
                value: member.slayerExperience.toLocaleString(),
                inline: true,
              }
            );

          const guild = await this.client.guilds.fetch(config.guildId);
          const channel = guild.channels.cache.get(
            config.channels.SLAYER_TASKS
          ) as TextChannel;
          if (!channel)
            return console.error(
              "Failed to find channel to send slayer task completion message. Text channel could not be found"
            );

          channel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error("Error checking slayer tasks", error);
      }
    });

    setTimeout(() => {
      this.checkSlayerTasks();
    }, TIME_TO_CHECK_SLAYER_TASKS);
  }

  /**
   * Gets the task of a member.
   * @param discordId - The discord ID of the member.
   * @returns A promise that resolves to the task of the member or false if the member does not exist.
   */
  public async getTask(discordId: string): Promise<Task | false> {
    const member = this.getMemberData(discordId);
    if (!member) return false;

    const task = await this.client.database.slayerTask.findFirst({
      where: {
        userId: member.id,
      },
    });

    return task ?? false;
  }

  /**
   * Registers a new member.
   * @param discordId - The discord ID of the member.
   * @param rsn - The RuneScape name of the member.
   * @returns A promise that resolves to the new member or false if the member already exists.
   */
  public async registerMember(
    discordId: string,
    rsn: string
  ): Promise<Boolean | User> {
    const exists = await this.client.database.user.findFirst({
      where: {
        discordId,
      },
    });

    if (exists) return false;

    const newMember = await this.client.database.user.create({
      data: {
        discordId,
        rsn,
      },
    });

    this.members.push(newMember);

    return newMember;
  }

  /**
   * Updates a member.
   * @param discordId - The discord ID of the member.
   * @param data - The data to update.
   */
  public async updateMember(discordId: string, data: Partial<User>) {
    try {
      await this.client.database.user.update({
        where: {
          discordId,
        },
        data: {
          ...data,
        },
      });
    } catch (error) {
      console.error("Error updating registered member", error);
    }
  }

  /**
   * Gets the data of a member.
   * @param discordId - The discord ID of the member.
   * @returns The member or false if the member does not exist.
   */
  public getMemberData(discordId: string): User | false {
    const member = this.members.find(
      (member) => member.discordId === discordId
    );
    return member ?? false;
  }

  /**
   * Removes GP from a member.
   * @param discordId - The discord ID of the member.
   * @param amount - The amount of GP to remove.
   * @returns A promise that resolves to the new GP of the member or false if the member does not exist or does not have enough GP.
   */
  public async removeGP(
    discordId: string,
    amount: number
  ): Promise<boolean | number> {
    const member = this.getMemberData(discordId);
    if (!member) return false;

    if (member.gp < amount) return false;
    member.gp -= amount;

    await this.updateGP(discordId, member.gp);

    return +member.gp;
  }

  /**
   * Adds GP to a member.
   * @param discordId - The discord ID of the member.
   * @param amount - The amount of GP to add.
   * @returns A promise that resolves to the new GP of the member or false if the member does not exist.
   */
  public async addGP(
    discordId: string,
    amount: number
  ): Promise<boolean | number> {
    const member = this.getMemberData(discordId);
    if (!member) return false;

    member.gp += amount;
    await this.updateGP(discordId, member.gp);
    return member.gp;
  }

  /**
   * Updates the GP of a member.
   * @param discordId - The discord ID of the member.
   * @param amount - The new amount of GP.
   * @returns A promise that resolves to the new GP of the member or false if the member does not exist.
   */
  public async updateGP(
    discordId: string,
    amount: number
  ): Promise<boolean | number> {
    const member = this.getMemberData(discordId);
    if (!member) return false;

    member.gp = amount;

    await this.client.database.user.update({
      where: {
        discordId,
      },
      data: {
        gp: member.gp,
      },
    });

    return member.gp;
  }

  public get isReady(): boolean {
    return this.ready;
  }
}
