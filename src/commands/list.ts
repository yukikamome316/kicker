import { Interaction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getRoleTextsByOptionName, getRoleMemberList } from "../utils/roles";

const DEFAULT_HEAD_COUNT = 10;

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('make a list members positive/negative specific roles')
  .addStringOption(option =>
		option.setName('positive')
			.setDescription('Roles that members have')
      .setRequired(false))
  .addStringOption(option => 
    option.setName('negative')
      .setDescription('Roles that members don\'t have')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('head_count')
      .setDescription('Showing the names of the number of people')
      .setRequired(false)
      .setMinValue(1));

export const execute = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const headCount = interaction.options.getInteger('head_count') ?? DEFAULT_HEAD_COUNT;
  
  const roleWithMemberTexts = getRoleTextsByOptionName(interaction, 'positive');
  const roleWithoutMemberTexts = getRoleTextsByOptionName(interaction, 'negative');

  await interaction.deferReply();
  
  const memberResults = await getRoleMemberList(
    interaction,
    headCount,
    roleWithMemberTexts,
    roleWithoutMemberTexts);

  if (!memberResults) return;

  const headName = `Head (count=${headCount})`;
  const embedToSend = new EmbedBuilder()
  .setColor("Blue")
  .setTitle('Search result')
  .addFields(
      { name: 'User count', value: memberResults.count.toString()},
      { name: headName, value: memberResults.head},
      { name: 'Positive', value: memberResults.positive, inline: true},
      { name: 'Negative', value: memberResults.negative, inline: true},
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embedToSend] });
};
