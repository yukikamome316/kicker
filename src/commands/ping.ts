import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('test')

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  await interaction.reply({content: 'pong!', ephemeral: true});
};
