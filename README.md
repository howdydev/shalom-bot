## Shalom

Shalom Discord bot is a Discord bot I use for my personal Discord server, the features are heavily focused on our environment and isn't quite as feature rich as other Discord bots you'd find around.

### Features

- Slash command handler
- Events handler
- Prisma ORM
- Trivia system
- Slayer task system to mimic tasks from OldSchool RuneScape
- Economy in the form of OSRS GP.

### Installing

1.  Clone the repository by running

        git clone https://github.com/howdydev/shalom-bot

2.  Rename `.env.example` to `.env` and fill in necessary information.
3.  Install packages with `npm i`, `yarn` or `pnpm i`
4.  Push database `npx prisma db push` and `npx prisma generate`
5.  Run bot with `npm run dev`
