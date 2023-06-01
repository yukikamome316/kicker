import { Role, Interaction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { string } from "zod";

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

  const DEFAULT_HEAD_COUNT = 10;

  const rolesWithMemberRawText = interaction.options.getString('positive') ?? 'None';
  const rolesWithoutMemberRawText = interaction.options.getString('negative') ?? 'None';
  const headCount = interaction.options.getInteger('head_count') ?? DEFAULT_HEAD_COUNT;

  const roleRegex = /(<@&\w+>)/g;
  const rolesWithMemberText = Array.from(
    rolesWithMemberRawText.matchAll(roleRegex) ?? 'None', match => match[1]);
  const rolesWithoutMemberText = Array.from(
    rolesWithoutMemberRawText.matchAll(roleRegex) ?? 'None', match => match[1]);
  
  let rolesWithMember: Role[] = [];
  let rolesWithoutMember: Role[] = [];

  const getRoleByMention = (mention: string): Role | null => {
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

  rolesWithMemberText.forEach(text => {
    const role = getRoleByMention(text);
    if (role)
      rolesWithMember.push(role);
  });
  rolesWithoutMemberText.forEach(text => {
    const role = getRoleByMention(text);
    if (role)
      rolesWithoutMember.push(role);
  });

  const allMembers = interaction.guild?.members.cache;
  if (!allMembers) return;

  const members = allMembers.filter(member => {
    const hasAllRoles = rolesWithMember.every(role => member.roles.cache.has(role.id));
    const hasNoRoles = rolesWithoutMember.every(role => !member.roles.cache.has(role.id));
  
    return hasAllRoles && hasNoRoles;
  });

  const rolesWithMemberString = rolesWithMember.map(role => '<@&' + role.id + '>').join(' ');
  const rolesWithoutMemberString = rolesWithoutMember.map(role => '<@&' + role.id + '>').join(' ');
  
  const membersCount = members ? members.size : 0;
  
  const getHeadMembers = (n: number) => {
    let tmp = [];
    for (let i = 0; i < n; i++) {
      if (i >= members.size) break;
      tmp.push(members.at(i)?.displayName);
    }
    return tmp.join(', ');
  };
  
  const headName = `Head (count=${headCount})`;
  const embedToSend = new EmbedBuilder()
  .setColor("Blue")
  .setTitle('Search result')
  .addFields(
    { name: 'User count', value: membersCount.toString()},
    { name: headName, value: getHeadMembers(headCount)},
    { name: 'Positive', value: rolesWithMemberString || 'None', inline: true},
    { name: 'Negative', value: rolesWithoutMemberString || 'None', inline: true},
    )
    .setTimestamp();

  interaction.reply({ embeds: [embedToSend]});
};
