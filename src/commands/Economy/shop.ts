import {
	ActionRowBuilder,
	ComponentType,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { CommandType } from "../../types/command";
import { formatNumber } from "../../utils";
import TaskList from "../../systems/slayer/tasks";

const busy: Map<string, boolean> = new Map();

enum ShopPrices {
	AFK_SLAYER = 300000000,
	SLAUGHTER = 750000,
	EXPEDITIOUS = 800000,
	BONUS_GP = 10000000,
}

const shop_options = [
	{
		id: "afk-slayer",
		description:
			"I will continuously give you slayer tasks one after the other",
		label: "AFK Slayer",
		value: "afk-slayer",
		price: ShopPrices.AFK_SLAYER,
	},
	{
		id: "slaughter",
		description:
			"You wear a bracelet of slaughter on your current slayer task to increase the amount you kill",
		label: "Bracelet of Slaughter",
		value: "slaughter",
		price: ShopPrices.SLAUGHTER,
	},
	{
		id: "bonus-gp",
		description: `Permanent additional bonus 10% GP per task completed. Max purchase (10)`,
		label: "Bonus GP (10%)",
		value: "bonus-gp",
		price: ShopPrices.BONUS_GP,
	},
	// {
	// 	id: "expeditious",
	// 	description:
	// 		"You wear an expeditious bracelet on your current slayer task to reduce the amount you kill",
	// 	label: "Bracelet of Expeditious",
	// 	value: "expeditious",
	// 	price: ShopPrices.EXPEDITIOUS,
	// },
];

export const command: CommandType = {
	builder: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("View the shop"),
	run: async (client, interaction) => {
		const member = client.members.getMemberData(interaction.user.id);
		if (!member) {
			return interaction.reply({
				content:
					"You must register before you can use the shop `/register`",
				ephemeral: true,
			});
		}

		const options: StringSelectMenuOptionBuilder[] = [];

		for (const option of shop_options) {
			options.push(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${option.label} (${formatNumber(option.price)})`)
					.setDescription(option.description)
					.setValue(option.value)
			);
		}

		const select = new StringSelectMenuBuilder()
			.setCustomId(interaction.id)
			.setPlaceholder("Open the shop")
			.addOptions(...options);

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				select
			);

		const reply = await interaction.reply({
			content: `Welcome to the shop! You have <:gp:1171046821137760309> ${formatNumber(
				member.gp
			)} GP`,
			components: [row],
			ephemeral: true,
		});

		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			filter: (i) =>
				i.user.id === interaction.user.id &&
				i.customId === interaction.id,
		});

		const updateReply = async (msg?: string) =>
			await interaction.editReply({ content: msg, components: [] });

		const slayerSettings = client.members.getSlayerSettings(
			interaction.user.id
		);

		collector.on("collect", async (interaction) => {
			switch (interaction?.values[0]) {
				case "expeditious":
					await updateReply("This feature is not yet implemented");
					break;
				case "bonus-gp":
					if (
						slayerSettings?.bonusGP &&
						slayerSettings?.bonusGP >= 100
					) {
						await updateReply(
							"You already have the maximum amount of bonus GP (100%)"
						);
						break;
					}

					const purchased = await client.members.removeGP(
						member.discordId,
						ShopPrices.BONUS_GP
					);

					if (!purchased) {
						await updateReply(
							"You do not have enough GP to purchase this"
						);
						break;
					}

					const currentBonus = slayerSettings?.bonusGP ?? 0;
					const newBonus = currentBonus + 10;

					const updatedSettings =
						await client.members.setSlayerSettings(
							member.discordId,
							{
								bonusGP: newBonus,
							}
						);

					if (!updatedSettings) {
						await updateReply(
							"An unknown error occurred. Please try again later"
						);
						break;
					}

					await updateReply(
						`Purchase successful. You now have ${updatedSettings.bonusGP}% bonus GP`
					);

					break;

				case "slaughter":
					const currentTask = client.members.slayerTasks.find(
						(u) => u.userId === member.id
					);

					if (!currentTask) {
						await updateReply("You have no current slayer task");
						break;
					}

					if (currentTask.shopModified) {
						await updateReply(
							"You are already wearing a slaughter or expeditious bracelet for this task. Try again next task."
						);
						break;
					}

					const monsterValues = TaskList["Duradel"]?.find(
						(m) => m.name === currentTask.name
					);
					if (!monsterValues) {
						await updateReply(
							"Could not find monster values for current task"
						);
						break;
					}

					const removedGP = await client.members.removeGP(
						member.discordId,
						ShopPrices.SLAUGHTER
					);

					if (!removedGP) {
						await updateReply(
							"You do not have enough GP to purchase this"
						);
						break;
					}

					const currentAmount = currentTask.amount;
					const currentTtk = monsterValues.timeToKill;

					const { amount, timeAdded } = getSlaughterValues(
						currentAmount,
						currentTtk
					);

					const newFinishedAt = new Date(
						currentTask.finishedAt.getTime() + timeAdded
					);
					const experience = Math.floor(
						monsterValues.hitpoints * amount
					);

					await client.database.slayerTask.update({
						where: {
							id: currentTask.id,
						},
						data: {
							amount,
							finishedAt: newFinishedAt,
							experience,
						},
					});

					await client.members.updateSlayerTask(currentTask.id, {
						shopModified: true,
						amount,
						finishedAt: newFinishedAt,
					});

					await updateReply(
						`Purchase successful. You are now slaughtering your task. It should now be finished at <t:${Math.round(
							newFinishedAt.getTime() / 1000
						)}:f>`
					);

					break;
				case "afk-slayer":
					const settings = client.members.getSlayerSettings(
						interaction.user.id
					);

					if (!settings) {
						await updateReply(
							"Could not find any settings for your profile, please try again later."
						);
						break;
					}

					if (settings.afkSlayer) {
						await updateReply(
							"You have already purchased this from me"
						);
						break;
					}

					busy.set(interaction.user.id, true);
					if (
						!(await client.members.removeGP(
							interaction.user.id,
							300000000
						))
					) {
						busy.set(interaction.user.id, false);
						await updateReply(
							"You do not have enough GP to purchase this"
						);
						break;
					}

					busy.set(interaction.user.id, true);
					const result = await client.members.setSlayerSettings(
						member.discordId,
						{
							afkSlayer: true,
						}
					);

					if (!result) {
						interaction.reply({
							content:
								"I was unable to purchase this for you, please try back later or report the problem.",
							ephemeral: true,
						});

						await client.members.addGP(
							member.discordId,
							ShopPrices.AFK_SLAYER
						);
					} else {
						interaction.reply({
							content:
								"Purchase successful. I will now reassign you slayer tasks as soon as they've been completed.",
							ephemeral: true,
						});
					}

					busy.set(interaction.user.id, false);
					await updateReply();
					break;
				default:
					interaction.reply({
						content:
							"An unknown error occurred. Please try again later",
						ephemeral: true,
					});
					break;
			}
		});
	},
};

function getSlaughterValues(amount: number, ttk: number) {
	let addedAmount = 0;

	for (let i = 0; i < amount; i++) {
		if (Math.random() < 0.25) {
			addedAmount++;
		}
	}

	return {
		amount: amount + addedAmount,
		timeAdded: Math.round((ttk * 1000 * addedAmount) / 2),
	};
}
