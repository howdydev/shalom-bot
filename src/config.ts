const config = {
  guildId: process.env.GUILD_ID as string,
  triviaEnabled: true,
  kickWatchEnabled: false,
  channels: {
    TRIVIA: "1225975390070378586",
    SLAYER_TASKS: "1225975418545373195",
    // TRIVIA: "1227282138387320904", // dev
    // SLAYER_TASKS: "1227282163456540772", // dev
  },
} as const;

export default config;
