const { SlashCommandBuilder } = require("discord.js");
const { MessageFlags } = require("discord.js");
const SessionManager = require("../../utils/sessionManager");
const BattleManager = require("../../utils/battleManager");
const crypto = require("crypto");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("session")
        .setDescription("Manage game sessions")
        .addSubcommand((subcommand) =>
            subcommand.setName("create").setDescription("Create a new session")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("join")
                .setDescription("Join an existing session")
                .addStringOption((option) =>
                    option.setName("sessionid").setDescription("Session ID to join").setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("leave")
                .setDescription("Leave the current session")
                .addStringOption((option) =>
                    option.setName("sessionid").setDescription("Session ID to leave").setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Get info about a session")
                .addStringOption((option) =>
                    option.setName("sessionid").setDescription("Session ID").setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("end")
                .setDescription("End a session (moderator only)")
                .addStringOption((option) =>
                    option.setName("sessionid").setDescription("Session ID to end").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("addmonster")
            .setDescription("Add a monster to the session.")
            .addStringOption(option =>
                option.setName("name")
                .setDescription("Select a monster (leave empty for a random monster)")
                .setAutocomplete(true)
                .setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("startbattle")
                .setDescription("Start a battle in the session")
                .addStringOption((option) =>
                    option.setName("sessionid")
                    .setDescription("Session ID to start battle")
                    .setRequired(true)
                )
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const monsters = await Monster.find({}, "name").limit(25);
        console.log(monsters);

        const filtered = monsters
            .filter(monster => monster.name.toLowerCase().includes(focusedValue.toLowerCase()))
            .map(monster => ({ name: monster.name, value: monster.name }));
    
        await interaction.respond(filtered.length ? filtered : [{ name: "No matches found", value: "none" }]);
    },

    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const sessionManager = new SessionManager();

        switch (subcommand) {
            case "create":
                const newSessionId = crypto.randomBytes(3).toString("hex");
                const created = await sessionManager.createSession(newSessionId, userId);
                if (created) {
                    return interaction.reply(`✅ Session created! ID: **${newSessionId}**`);
                } else {
                    return interaction.reply("❌ You already have an active session.");
                }

            case "join": {
                const sessionId = interaction.options.getString("sessionid");
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const joined = await sessionManager.joinSession(sessionId, userId);
                return joined
                    ? interaction.reply(`✅ You joined session **${sessionId}**.`)
                    : interaction.reply("❌ Could not join session. It might not exist.");
            }

            case "leave": {
                const sessionId = interaction.options.getString("sessionid");
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const left = await sessionManager.leaveSession(sessionId, userId);
                return left
                    ? interaction.reply(`✅ You left session **${sessionId}**.`)
                    : interaction.reply("❌ You are not in this session.");
            }

            case "info": {
                const providedSessionId = interaction.options.getString("sessionid");
                const activeSession = await SessionManager.getActiveSession(userId);
                const currentSessionId = providedSessionId || activeSession?.sessionId;

                if (!currentSessionId) {
                    return interaction.reply({ content: "❌ You must provide a session ID.", ephemeral: true });
                }

                const session = await SessionManager.getSession(currentSessionId);
                if (!session) {
                    return interaction.reply({ content: "❌ Session not found.", ephemeral: true });
                }

                return interaction.reply({
                    content: `📜 **Session Info**\n🔹 ID: ${session.sessionId}\n🛡 Moderator: <@${session.moderatorId}>\n👥 Players: ${
                        session.players.map((p) => `<@${p}>`).join(", ") || "None"
                    }`,
                    ephemeral: true
                });
            }

            case "end": {
                const sessionId = interaction.options.getString("sessionid");
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const sessionToEnd = await SessionManager.getSession(sessionId);
                if (!sessionToEnd) return interaction.reply("❌ Session not found.");
                if (sessionToEnd.moderatorId !== userId) return interaction.reply("❌ Only the moderator can end this session.");

                await sessionManager.endSession(sessionId);
                return interaction.reply(`🛑 Session **${sessionId}** has been ended.`);
            }

            case "addmonster": {
                const activeSession = await SessionManager.getActiveSession(userId);
                if (!activeSession) {
                    return interaction.reply({ content: "❌ You don't have an active session.", ephemeral: true });
                }

                if (activeSession.moderatorId !== userId) {
                    return interaction.reply({ content: "❌ Only the moderator can add monsters.", ephemeral: true });
                }

                const sessionId = activeSession.sessionId;
                const monsterName = interaction.options.getString("name");

                await interaction.deferReply({ ephemeral: true });

                let result;

                if (monsterName) {
                    result = await SessionManager.addMonsterByName(sessionId, monsterName);
                } else {
                    result = await SessionManager.addRandomMonster(sessionId);
                }

                if (!result) {
                    result = "❌ An error occurred while adding the monster.";
                }

                return interaction.editReply({ content: result });
            }

            case "startbattle": {
                const sessionId = interaction.options.getString("sessionid");
                const battleSession = await SessionManager.getSession(sessionId);
                if (!battleSession) return interaction.reply("❌ Session not found.");
                if (battleSession.moderatorId !== userId) return interaction.reply("❌ Only the moderator can start a battle.");
                await interaction.deferReply();
                const battleStartMessage = await BattleManager.startBattle(interaction, sessionId);
                break;
            }
        }
    },
};