import triviaQuestions from "../utils/trivia-questions";
import ExtendedClient from "./extended-client";
import config from "../config";
import { EmbedBuilder, TextChannel } from "discord.js";
import { TriviaQuestion } from "@prisma/client";

export default class TriviaGenerator {
  private readonly client: ExtendedClient;
  public readonly questions: TriviaQuestion[] = [];
  public currentQuestion: TriviaQuestion | null = null;
  public currentAnswers: string[] = [];
  public reward: number;
  public isReady: boolean = false;

  constructor(client: ExtendedClient) {
    this.client = client;
  }

  public async init() {
    console.info("Trivia: Initializing");
    await this.fetchAllQuestions();
    console.success(`Trivia: Loaded ${this.questions.length} questions`);
    this.shuffleQuestions();
    this.startGeneratingQuestions();
    this.isReady = true;
  }

  private async fetchAllQuestions() {
    const result = await this.client.database.triviaQuestion.findMany();
    this.questions.push(...result);
  }

  public isTriviaActive() {
    return this.currentQuestion !== null;
  }

  public getTriviaAnswers() {
    return this.currentAnswers;
  }

  public endTrivia() {
    this.currentQuestion = null;
  }

  public async startGeneratingQuestions() {
    if (this.questions.length === 0) {
      console.error(`Trivia: No questions found`);
      return;
    }

    this.generateQuestion();
    setInterval(this.generateQuestion.bind(this), 15 * 60 * 1000);
    // setInterval(this.generateQuestion.bind(this), 30000);
  }

  public async generateQuestion() {
    await this.clearTriviaChannel();
    const selectedQuestion = this.questions.shift() as TriviaQuestion;
    this.questions.push(selectedQuestion);
    this.currentQuestion = selectedQuestion;
    this.reward = Math.floor(Math.random() * 40000) + 10000;
    this.currentAnswers = selectedQuestion.answer.split(", ");
    await this.sendTriviaQuestionToChannel(
      selectedQuestion.question,
      selectedQuestion.id
    );
  }

  public async clearTriviaChannel() {
    const guild = await this.client.guilds.fetch(config.guildId);
    if (!guild) return console.error("Trivia: Guild not found");

    const channel = await guild.channels.fetch(config.channels.TRIVIA);
    if (!channel || !(channel instanceof TextChannel))
      return console.error("Trivia: Channel not found");

    for (let i = 0; i < 10; i++)
      await (channel as TextChannel).bulkDelete(100).catch(console.error);
  }

  public async addTriviaQuestion(data: {
    question: string;
    answer: string;
    createdBy: string;
  }) {
    const success = await this.client.database.triviaQuestion.create({
      data,
    });

    if (!success) return false;

    this.questions.push(success);
    return success.id;
  }

  public async sendTriviaQuestionToChannel(
    question: string,
    questionId: string
  ) {
    const guild = await this.client.guilds.fetch(config.guildId);
    const embed = new EmbedBuilder()
      .setTitle("Trivia")
      .setDescription(
        `A new trivia is active, you have 15 minutes to answer the question correctly.`
      )
      .addFields({ name: "Question", value: question })
      .setThumbnail(
        "https://oldschool.runescape.wiki/images/thumb/Wise_Old_Man.png/130px-Wise_Old_Man.png?b2e69"
      )
      .setFooter({
        text: `Question ID: ${questionId}`,
      });
    if (!guild) return console.error("Trivia: Guild not found");

    const channel = await guild.channels.fetch(config.channels.TRIVIA);
    if (!channel || !(channel instanceof TextChannel))
      return console.error("Trivia: Channel not found");

    await (channel as TextChannel).send({
      embeds: [embed],
    });
  }

  private shuffleQuestions() {
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [
        this.questions[j],
        this.questions[i],
      ];
    }
  }
}
