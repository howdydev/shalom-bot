const config = {
  guildId: process.env.GUILD_ID as string,
  triviaEnabled: true,
  kickWatchEnabled: false,
  channels: {
    TRIVIA: process.env.TRIVIA_CHANNEL_ID as string,
    SLAYER_TASKS: process.env.SLAYER_TASKS_CHANNEL_ID as string,
  },
} as const;

export default config;
