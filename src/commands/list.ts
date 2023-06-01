import { RPCCloseEventCodes } from "discord.js";
import { RequestManager, Role, GuildMember } from "discord.js";
import { Interaction, CommandInteraction, SlashCommandBuilder, SlashCommandRoleOption } from "discord.js";
import { RawRoleData, RawUserData } from "discord.js/typings/rawDataTypes";

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('make a list members with/without specific roles')
  .addStringOption(option =>
		option.setName('with')
			.setDescription('Roles that members have')
      .setRequired(false))
  .addStringOption(option => 
    option.setName('without')
      .setDescription('Roles that members don\'t have')
      .setRequired(false))

export const execute = async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  // const plus_1 = interaction.options.get('plus_1');
  // const minus_1 = interaction.options.get('minus_1');

  const rolesWithMemberRawText = interaction.options.getString('with') ?? 'None';
  const rolesWithoutMemberRawText = interaction.options.getString('without') ?? 'None';
  
  const roleRegex = /(<@&\w+>)/g;
  const rolesWithMemberText = Array.from(
    rolesWithMemberRawText.matchAll(roleRegex), match => match[1]);
  const rolesWithoutMemberText = Array.from(
    rolesWithoutMemberRawText.matchAll(roleRegex), match => match[1]);
  
  let rolesWithMember: Role[] = [];
  let rolesWithoutMember: Role[] = [];

  const getRoleByMention = (mention: string): Role | null => {
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

};
