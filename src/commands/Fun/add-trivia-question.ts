import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../../types/command";

export const command: CommandType = {
  builder: new SlashCommandBuilder()
    .setName("add-trivia-question")
    .setDescription("Add a trivia question to the database.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question you'd like to add")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("answers")
        .setDescription("The answers to the question. Separate with commas.")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const member = client.members.getMemberData(interaction.user.id);
      if (!member)
        return await interaction.editReply(
          "You are not a registered member! `/register`."
        );

      if (!member.canCreateTriviaQuestion) {
        return await interaction.editReply(
          "You are banned from creating trivia questions."
        );
      }

      const question = interaction.options.getString("question", true);
      const answers = interaction.options.getString("answers", true);

      const success = await client.trivia.addTriviaQuestion({
        question,
        answer: answers,
        createdBy: interaction.user.id,
      });

      if (!success)
        return await interaction.editReply(
          `I could not add the question: \`${question}\`.`
        );

      const displayedAnswers = answers.split(", ");

      return await interaction.editReply(
        `I have successfully added the question: \`${question}\` with answers: \`${displayedAnswers.join(
          ", "
        )}\` **Question ID:** $${success}.`
      );
    } catch (error) {
      await interaction.editReply(
        "An unknown error occurred. Please try again later"
      );
      console.error("Error adding GP to user from /givegp", error);
    }
  },
};
