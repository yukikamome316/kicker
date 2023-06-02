import { Events, Role, Interaction, SlashCommandBuilder, EmbedBuilder, Collection, GuildMember, GuildMemberManager, GuildMemberRoleManager } from "discord.js";
import { client } from '../main';
import { CommandInteraction } from "discord.js";

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
  count: Number,
  head: string,
  positive: string,
  negative: string,
}

const getRoleMemberList = async (
  interaction: CommandInteraction,
  headCount: number,
  rolesWithMemberText: string[],
  rolesWithoutMemberText: string[]): Promise<RoleMemberList | null> => {
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

    const guild = await client.guilds.fetch(interaction.guild?.id ?? "");
    const allMembers: GuildMember[] = [];

    try {
      await guild.members.fetch();

      guild.members.cache.forEach((member) => {
        allMembers.push(member);
      });
    } catch (error) {
      console.error("Failed to fetch guild members:", error);
      return null;
    }

    const members = allMembers.filter(member => {
      const hasAllRoles = rolesWithMember.every(role => member.roles.cache.has(role.id));
      const hasNoRoles = rolesWithoutMember.every(role => !member.roles.cache.has(role.id));
    
      return hasAllRoles && hasNoRoles;
    });

    const rolesWithMemberString = rolesWithMember.map(role => '<@&' + role.id + '>').join(' ');
    const rolesWithoutMemberString = rolesWithoutMember.map(role => '<@&' + role.id + '>').join(' ');
    
    const membersCount = members ? members.length : 0;
    
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

export const execute = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const rolesWithMemberRawText = interaction.options.getString('positive') ?? 'None';
  const rolesWithoutMemberRawText = interaction.options.getString('negative') ?? 'None';
  const headCount = interaction.options.getInteger('head_count') ?? DEFAULT_HEAD_COUNT;

  const roleRegex = /(<@&\w+>)/g;
  const rolesWithMemberText = Array.from(
    rolesWithMemberRawText.matchAll(roleRegex) ?? 'None', match => match[1]);
  const rolesWithoutMemberText = Array.from(
    rolesWithoutMemberRawText.matchAll(roleRegex) ?? 'None', match => match[1]);

  await interaction.deferReply();
  
  const list = await getRoleMemberList(
    interaction,
    headCount,
    rolesWithMemberText,
    rolesWithoutMemberText);

  if (!list) return;

  const headName = `Head (count=${headCount})`;
  const embedToSend = new EmbedBuilder()
  .setColor("Blue")
  .setTitle('Search result')
  .addFields(
      { name: 'User count', value: list.count.toString()},
      { name: headName, value: list.head},
      { name: 'Positive', value: list.positive, inline: true},
      { name: 'Negative', value: list.negative, inline: true},
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embedToSend] });
};
