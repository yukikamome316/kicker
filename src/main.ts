// Require the necessary discord.js classes
import { GatewayIntentBits, Client, Partials, Events } from 'discord.js'
import { z } from 'zod';
import { config } from 'dotenv';

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  BOT_ID: z.string(),
});

config();

export type Env = z.infer<typeof envSchema>

const env = envSchema.parse(process.env);

// Create a new client instance
const client = new Client({
    intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});


// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(env.BOT_TOKEN);
