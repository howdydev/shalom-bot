import { EmbedBuilder, Events, Message } from "discord.js";
import ExtendedClient from "../classes/extended-client";
import { Event as EventType } from "../types/event";
import config from "../config";

export const event: EventType = {
	name: Events.MessageCreate,
	type: "on",
	run: async (client: ExtendedClient, message: Message) => {
		if (message.author.bot) return;

		try {
			const userId = message.author.id;
			const channelID = message.channelId;
			const channel = message.channel;

			if (channelID === config.channels.TRIVIA) {
				const answer = message.content;

				const member = client.members.getMemberData(userId);
				if (!member) return;

				if (!client.trivia.isTriviaActive()) {
					const botMsg = await message.reply({
						content: "There is no trivia active at the moment.",
					});

					setTimeout(async () => {
						await message.delete();
						await botMsg.delete();
					}, 5000);

					return;
				}

				const answers = client.trivia.getTriviaAnswers();

				if (!answers) {
					message.reply({
						content:
							"An unknown error occurred, please wait for the next trivia.",
					});

					return client.trivia.endTrivia();
				}

				await message.delete();

				const answersToLowercase = answers.map((answer) =>
					answer.toLowerCase()
				);

				if (!answersToLowercase.includes(answer.toLowerCase())) {
					client.trivia.addGuess(answer, userId);
					return;
				}

				if (!client.trivia.isTriviaActive()) return;

				const guesses = client.trivia.fetchGuesses();
				const embed =
					guesses.length > 0
						? new EmbedBuilder()
								.setColor("Random")
								.setTitle(`Guess History`)
								.setDescription(
									`Here are all of the user guesses in the current trivia (Not including the correct answer)`
								)
								.addFields(
									guesses.map(([guess, user]) => ({
										name: `<@${user}>`,
										value: `${guess}`,
										inline: true,
									}))
								)
						: null;

				await channel.send({
					content: `**<@${userId}> has won**, you have been awarded <:gp:1171046821137760309> ${client.trivia.reward}.`,
				});

				if (embed) await channel.send({ embeds: [embed] });

				client.trivia.endTrivia();
				client.members.addGP(userId, client.trivia.reward);
			}
		} catch (error) {
			console.error(`messageCreateEvent.ts: ${error}`);
		}
	},
};
