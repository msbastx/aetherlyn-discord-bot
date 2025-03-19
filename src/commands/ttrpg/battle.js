const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const SessionManager = require("../../utils/sessionManager");
const BattleManager = require("../../utils/battleManager");
const { MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("battle")
        .setDescription("Start or manage a battle session.")
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName("start")
                .setDescription("Start a new battle session.")
                .addStringOption(option =>
                    option
                        .setName("session_id")
                        .setDescription("The session ID to start the battle.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("Check the current battle status.")
                .addStringOption(option =>
                    option
                        .setName("session_id")
                        .setDescription("The session ID to check battle status.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("end")
                .setDescription("End an ongoing battle session.")
                .addStringOption(option =>
                    option
                        .setName("session_id")
                        .setDescription("The session ID to end the battle.")
                        .setRequired(true)
                )
        ),

    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();
        const sessionId = interaction.options.getString("session_id");


        if (subcommand === "start") {
            await BattleManager.startBattle(interaction, sessionId);
        }

        else if (subcommand === "status") {
            const session = await SessionManager.getSession(sessionId);
            if (!session) {
                return interaction.reply({ 
                    content: "❌ Session not found.", 
                    flags: MessageFlags.Ephemeral  // ✅ Replaces "ephemeral: true"
                });
            }
        
            const battleEmbed = BattleManager.createBattleEmbed(session.participants);
            return interaction.reply({ embeds: [battleEmbed] });
        }

        else if (subcommand === "end") {
            const session = await SessionManager.getSession(sessionId);
            if (!session) {
                return interaction.reply({ content: "❌ Session not found.", ephemeral: true });
            }

            await SessionManager.endSession(sessionId);
            return interaction.reply("✅ The battle session has been ended.");
        }
    }
};
