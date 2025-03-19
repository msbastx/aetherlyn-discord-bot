const { SlashCommandBuilder } = require("discord.js");
const PlayerManager = require("../../utils/playerManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("player")
        .setDescription("Manage your TTRPG player profile.")
        .addSubcommand(subcommand =>
            subcommand.setName("create")
                .setDescription("Create your TTRPG player profile.")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("status")
                .setDescription("View your TTRPG player status.")
        ),
    
    async run({ interaction }) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            const response = await PlayerManager.createPlayer(userId, username);
            return interaction.reply(response.message);
        }

        if (subcommand === "status") {
            const player = await PlayerManager.getPlayer(userId);
            if (!player) return interaction.reply("❌ You are not registered as a player. Use `/player create` first!");

            return interaction.reply(`📜 **${player.username}'s Stats**\n❤️ HP: ${player.hp}\n⚔️ ATK: ${player.attack}\n🛡️ DEF: ${player.defense}\n🏃 SPD: ${player.speed}\n📌 In Session: ${player.isInSession ? "✅ Yes" : "❌ No"}`);
        }
    }
};
