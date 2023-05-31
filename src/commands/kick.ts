import { Interaction, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName('kickall')
  .setDescription('Kicks a user')
  .addRoleOption(option =>
    option.setName('plus')
      .setDescription('Plus role')
  )
  .addRoleOption(option =>
    option.setName('minus')
      .setDescription('Minus role')
      .setRequired(true)
  );

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  await interaction.reply('test');
};
