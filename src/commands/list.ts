import { Role, Interaction, SlashCommandBuilder, EmbedBuilder, GuildMember, Collection } from "discord.js";
import { client } from '../main';
import { ChatInputCommandInteraction } from "discord.js";

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

interface RoleMemberList {
  count: number,
  head: string,
  positive: string,
  negative: string,
}

const getRoleByMention = (interaction: ChatInputCommandInteraction, mention: string): Role | null => {
  if (!mention) return null;

  const match = mention.match(/^<@&(\d+)>$/);
  if (match) {
    const roleId = match[1];
    const role = interaction.guild?.roles.cache.get(roleId);
    if (role instanceof Role) {
      return role;
    }
  }
  return null;
};

const getRoleMemberList = async (
  interaction: ChatInputCommandInteraction,
  headCount: number,
  roleWithMemberTexts: string[],
  roleWithoutMemberTexts: string[]): Promise<RoleMemberList | null> => {
    let rolesWithMember: Role[] = [];
    let rolesWithoutMember: Role[] = [];
    
    roleWithMemberTexts.forEach(text => {
      const role = getRoleByMention(interaction, text);
      if (role)
        rolesWithMember.push(role);
    });
    roleWithoutMemberTexts.forEach(text => {
      const role = getRoleByMention(interaction, text);
      if (role)
        rolesWithoutMember.push(role);
    });

    await interaction.guild?.members.fetch();
    const allMembers: Collection<string, GuildMember> | undefined = interaction.guild?.members.cache;

    if (!allMembers) return null;

    const members = allMembers.filter(member => {
      const hasAllRoles = rolesWithMember.every(role => member.roles.cache.has(role.id));
      const hasNoRoles = rolesWithoutMember.every(role => !member.roles.cache.has(role.id));
      return hasAllRoles && hasNoRoles;
    });

    const rolesWithMemberString = rolesWithMember.map(role => '<@&' + role.id + '>').join(' ');
    const rolesWithoutMemberString = rolesWithoutMember.map(role => '<@&' + role.id + '>').join(' ');
    
    const membersCount = members ? members.size : 0;
    
    const getHeadMembers = (n: number) => {
      return members.map(member => member.displayName).slice(0, n).join(', ');
    };

    return {
      count: membersCount,
      head: getHeadMembers(headCount) || 'None',
      positive: rolesWithMemberString || 'None',
      negative: rolesWithoutMemberString || 'None',
    };
  };

const getRoleTextsByOptionName = (
  interaction: ChatInputCommandInteraction, option: string): Array<string> => {
  const roleRawText = interaction.options.getString(option) ?? 'None';
  const roleRegex = /(<@&\w+>)/g;

  const roleTexts = Array.from(
    roleRawText.matchAll(roleRegex) ?? 'None', match => match[1]);
    
  return roleTexts;
};

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
