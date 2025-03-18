const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kick!!!',
    devOnly: true,
    // testOnly: Boolean,
    options: [
        {
          name: 'target-user',
          description: 'The user you want to kick.',
          require: true,
          type: ApplicationCommandOptionType.Mentionable
        },
        {
            name: 'reason',
            description: 'The reason for the kick.',
            type: ApplicationCommandOptionType.String,
        },
    ],

    permissionsRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],

    
    /**
     * 
     * @param {*} client 
     * @param {*} interaction 
     */

    callback: async (client, interaction) => {
        const targetUserId = interaction.options.get('target-user').value;
        const reason = interaction.options.get('reason')?.value || "No reason provided";

        await interaction.deferReply();

        const targetUser = await interaction.guild.members.fetch(targetUserId);

        if (!targetUser) {
            await interaction.editReply("That user doesn't exist in this server");
            return;
        }

        if (targetUser.id === interaction.guild.ownerId) {
            await interaction.editReply("You can't kick the server owner");
            return;
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolesPosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.editReply("You can't kick someone with a higher or equal role than you");
            return;
        }

        if (targetUserRolePosition >= botRolesPosition) {
            await interaction.editReply("I can't kick that user because they have the same or higher role than me.");
            return;
        }

        try {
            await targetUser.kick(reason);
            await interaction.editReply(`User ${targetUser} was kicked\nReason : ${reason}`);
        } catch (error) {
            console.log(`There was an error when kicking: ${error}.`)
        }
    },
};