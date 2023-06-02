import { 
    ChatInputCommandInteraction,
    Role,
    GuildMember,
    Collection
} from "discord.js";

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

export const getRoleMemberList = async (
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
      return members.map(member => '<@' + member.id + '>').slice(0, n).join(', ');
    };

    return {
      count: membersCount,
      head: getHeadMembers(headCount) || 'None',
      positive: rolesWithMemberString || 'None',
      negative: rolesWithoutMemberString || 'None',
    };
  };

export const getRoleTextsByOptionName = (
  interaction: ChatInputCommandInteraction, option: string): Array<string> => {
  const roleRawText = interaction.options.getString(option) ?? 'None';
  const roleRegex = /(<@&\w+>)/g;

  const roleTexts = Array.from(
    roleRawText.matchAll(roleRegex) ?? 'None', match => match[1]);
    
  return roleTexts;
};
