const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Ban!!!',
    devOnly: true,
    // testOnly: Boolean,
    options: [
        {
          name: 'target-user',
          description: 'The user you want to ban.',
          require: true,
          type: ApplicationCommandOptionType.Mentionable
        },
        {
            name: 'reason',
            description: 'The reason for the ban.',
            type: ApplicationCommandOptionType.String,
        },
    ],

    permissionsRequired: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    
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
            await interaction.editReply("You can't ban the server owner");
            return;
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolesPosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.editReply("You can't ban someone with a higher or equal role than you");
            return;
        }

        if (targetUserRolePosition >= botRolesPosition) {
            await interaction.editReply("I can't ban that user because they have the same or higher role than me.");
            return;
        }

        try {
            await targetUser.ban({ reason });;
            await interaction.editReply(`User ${targetUser} was banned\nReason : ${reason}`);
        } catch (error) {
            console.log(`There was an error when banning: ${error}.`)
        }
    },
};