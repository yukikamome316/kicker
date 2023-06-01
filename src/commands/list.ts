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

};
