import {
  Interaction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ColorResolvable,
  PermissionFlagsBits,
  PermissionsBitField,
  bold,
  GuildMember
} from "discord.js";
import { getRoleTextsByOptionName, getRoleMemberList, RoleMemberList } from "../utils/roles";

const DEFAULT_HEAD_COUNT = 15;

const SUB_COMMAND_DISPLAY = 'display';
const SUB_COMMAND_KICK = 'kick';

const SUB_COMMAND_DISPLAY_EMBED_COLOR = 'Blue';
const SUB_COMMAND_KICK_EMBED_COLOR = 'Red';

export const data = new SlashCommandBuilder()
  .setName('list')
  .setDescription('Get info about members with positive/negative specific roles')
  .addSubcommand(subcommand => 
    subcommand
      .setName(SUB_COMMAND_DISPLAY)
      .setDescription('Display a list of members')
      .addStringOption(option =>
        option
          .setName('positive')
          .setDescription('Roles that members have')
          .setRequired(false)
      )
      .addStringOption(option => 
        option
          .setName('negative')
          .setDescription('Roles that members don\'t have')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('head_count')
          .setDescription('Showing the names of the number of people')
          .setRequired(false)
          .setMinValue(1)
      )
  )
  .addSubcommand(subcommand => 
    subcommand
      .setName(SUB_COMMAND_KICK)
      .setDescription('Kick all the listed members')
      .addStringOption(option =>
        option.setName('positive')
          .setDescription('Roles that members who will be kicked have')
          .setRequired(false))
      .addStringOption(option => 
        option.setName('negative')
          .setDescription('Roles that members who will be kicked DO NOT have')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('head_count')
          .setDescription('Showing the names of the number of people')
          .setRequired(false)
          .setMinValue(1)
      )
  )
  .setDMPermission(false);

const createRoleMemberListEmbeded = (memberResults: RoleMemberList, headCount: number, title: string, color: ColorResolvable) => {
  const headName = `Head (count=${headCount})`;
  const embedToSend = new EmbedBuilder()
  .setColor(color)
  .setTitle(title)
  .addFields(
      { name: 'User count', value: memberResults.count.toString()},
      { name: headName, value: memberResults.head},
      { name: 'Positive', value: memberResults.positive, inline: true},
      { name: 'Negative', value: memberResults.negative, inline: true},
    )
  .setTimestamp();

  return embedToSend;
}

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
  
  let subCommand = interaction.options.getSubcommand();

  const permissions = interaction.member?.permissions;
  if (permissions instanceof PermissionsBitField
    && !permissions.has(PermissionsBitField.Flags.KickMembers)) {
      subCommand = SUB_COMMAND_DISPLAY;
  }
  
  switch (subCommand) {
    case SUB_COMMAND_DISPLAY: {
      const embedToSend = createRoleMemberListEmbeded(
        memberResults,
        headCount,
        'Search result',
        SUB_COMMAND_DISPLAY_EMBED_COLOR
      );
      
      await interaction.editReply({ embeds: [embedToSend] });

      break;
    }
    case SUB_COMMAND_KICK: {
      const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Kick')
      .setStyle(ButtonStyle.Danger);
    
      const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
    
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(cancel, confirm);

      const embedToSend = createRoleMemberListEmbeded(
        memberResults,
        headCount,
        'CAUTION: Are you sure to kick all the members below?',
        SUB_COMMAND_KICK_EMBED_COLOR
      );

      const response = await interaction.editReply({
        embeds: [embedToSend],
        components: [row],
      });

      const collectorFilter = (i: Interaction) => i.user.id === interaction.user.id;
      try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        if (confirmation.customId === 'confirm') {
          await confirmation.update({ content: bold('Processing...'), components: [] });

          for (let member of memberResults.data) {
            const memberNickname = member?.displayName;
            console.log(`Kick ${memberNickname}`);
            await interaction.guild?.members.kick(member).catch(error => {
              if (error.code === 50013) {
                console.log(`Missing permissions to kick ${memberNickname}: ${error}`);
              } else {
                console.error(`DiscordAPIError[${error.code}]: ${error.message}`);
              }
            });
          }

          await confirmation.editReply({ content: bold('Done!'), components: [] });
          
        } else if (confirmation.customId === 'cancel') {
          await confirmation.update({ content: 'Action cancelled', components: [] });
        }
      } catch (e) {
        console.log(e);
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
      }

      break;
    }
  }
  
};
