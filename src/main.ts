import { 
  GatewayIntentBits, 
  Client, 
  Partials, 
  Events, 
  REST, 
  Routes, 
  Collection, 
  Interaction, 
  CommandInteraction,
  SlashCommandBuilder,
  GuildMemberRoleManager,
} from 'discord.js';
import { z } from 'zod';
import { config } from 'dotenv';
import * as kick from "./commands/ping";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  BOT_ID: z.string(),
});

config();

type Env = z.infer<typeof envSchema>

const env: Env = envSchema.parse(process.env);

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

client.once(Events.ClientReady, () => {
  console.log(`Ready! Logged in as ${client.user?.tag}`);
});

const commands = new Collection<string, { data: any, execute: (interaction: CommandInteraction) => Promise<void>}>()
commands.set(kick.data.name, {data: kick.data, execute: kick.execute});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

const rest = new REST({ version: '10' }).setToken(env.BOT_TOKEN);
const commandsList = Array.from(commands.values()).map(command => command.data.toJSON());

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(env.BOT_ID),
      { body: commandsList },
    );
    console.log('Successfully registered slash commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.login(env.BOT_TOKEN);
