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
  VoiceStateEditOptions,
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { any, map, z } from 'zod';
import { config } from 'dotenv';
import * as ping from "./commands/ping";
import * as kickall from "./commands/list";

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

interface Command {
  data: SlashCommandBuilder,
  execute(interaction: Interaction): Promise<any>;
}

const commands = new Collection<string, Command>();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  commands.set(command.data.name, command);
}

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
const commandsJson = Array.from(commands.values()).map(command => command.data.toJSON());

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(env.BOT_ID),
      { body: commandsJson },
    );
    console.log('Successfully registered slash commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.login(env.BOT_TOKEN);
