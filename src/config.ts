const config = {
  guildId: process.env.GUILD_ID as string,
  triviaEnabled: process.env.TRIVIA_ENABLED === "true",
  kickWatchEnabled: process.env.KICK_WATCH_ENABLED === "true",
  channels: {
    TRIVIA: process.env.TRIVIA_CHANNEL_ID as string,
    SLAYER_TASKS: process.env.SLAYER_TASKS_CHANNEL_ID as string,
  },
} as const;

export default config;
