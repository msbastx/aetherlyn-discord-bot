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
                    flags: MessageFlags.Ephemeral
                });
            }
        
            // Ensure battleState exists
            if (!session.battleState || !session.battleState.participants) {
                return interaction.reply({ 
                    content: "❌ No active battle found for this session.", 
                    flags: MessageFlags.Ephemeral
                });
            }
        
            const { participants, turnIndex } = session.battleState;
        
            // Log the participants array
            console.log("Participants:", JSON.stringify(participants, null, 2));
        
            // Separate players and monsters from participants
            const players = participants.filter((p) => p.type === "Player");
            const monsters = participants.filter((p) => p.type === "Monster");
        
            // Generate turnOrder from participants
            const turnOrder = participants
                .sort((a, b) => b.speed - a.speed)
                .map((entity) => entity.id);
        
            console.log("Players:", players);
            console.log("Monsters:", monsters);
            console.log("Turn Order:", turnOrder);
        
            // Create and send embed
            const battleEmbed = BattleManager.createBattleEmbed(players, monsters, turnOrder);
            return interaction.reply({ embeds: [battleEmbed] });
        }

        else if (subcommand === "end") {
            const sessionId = interaction.options.getString("session_id");
            const session = await SessionManager.getSession(sessionId);
        
            if (!session) {
                return interaction.reply({ content: "❌ Session not found.", ephemeral: true });
            }
        
            // End the battle (clear battle state)
            await SessionManager.endBattle(sessionId);
        
            return interaction.reply("✅ The battle has ended, but the session is still active.");
        }
    }
};
