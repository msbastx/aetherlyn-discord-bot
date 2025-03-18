const { SlashCommandBuilder } = require("discord.js");
const SessionManager = require("../../utils/sessionManager");
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
        .addSubcommand((subcommand) =>
            subcommand
                .setName("addmonster")
                .setDescription("Add a random monster to the session")
                .addStringOption((option) =>
                    option.setName("name")
                    .setDescription("Monster name (leave empty for random)")
                    .setRequired(false)
                )
        ),

    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();
        const sessionId = interaction.options.getString("sessionid");
        const userId = interaction.user.id;

        switch (subcommand) {
            case "create":
                const newSessionId = crypto.randomBytes(3).toString("hex"); // Unique session ID
                const created = await SessionManager.createSession(newSessionId, userId);
                if (created) {
                    return interaction.reply(`✅ Session created! ID: **${newSessionId}**`);
                } else {
                    return interaction.reply("❌ You already have an active session.");
                }

            case "join":
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const joined = await SessionManager.joinSession(sessionId, userId);
                return joined
                    ? interaction.reply(`✅ You joined session **${sessionId}**.`)
                    : interaction.reply("❌ Could not join session. It might not exist.");

            case "leave":
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const left = await SessionManager.leaveSession(sessionId, userId);
                return left
                    ? interaction.reply(`✅ You left session **${sessionId}**.`)
                    : interaction.reply("❌ You are not in this session.");

            case "info":
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const session = await SessionManager.getSession(sessionId);
                if (!session) return interaction.reply("❌ Session not found.");

                return interaction.reply(
                    `📜 **Session Info**\n🔹 ID: ${session.sessionId}\n🛡 Moderator: <@${session.moderatorId}>\n👥 Players: ${session.players
                        .map((p) => `<@${p}>`)
                        .join(", ") || "None"}`
                );

            case "end":
                if (!sessionId) return interaction.reply("❌ You must provide a session ID.");
                const sessionToEnd = await SessionManager.getSession(sessionId);
                if (!sessionToEnd) return interaction.reply("❌ Session not found.");
                if (sessionToEnd.moderatorId !== userId) return interaction.reply("❌ Only the moderator can end this session.");

                await SessionManager.endSession(sessionId);
                return interaction.reply(`🛑 Session **${sessionId}** has been ended.`);

            case "addmonster":
                // Check for active session
                const activeSession = await SessionManager.getActiveSession(userId);
                if (!activeSession) {
                    return interaction.reply("❌ You don't have an active session.");
                }

                // Check if the user is the moderator
                if (activeSession.moderatorId !== userId) {
                    return interaction.reply("❌ Only the moderator can add monsters.");
                }

                const monsterName = interaction.options.getString("name");
                let result;

                if (monsterName) {
                    result = await SessionManager.addMonsterByName(userId, monsterName);
                } else {
                    result = await SessionManager.addRandomMonster(userId);
                }

                return interaction.reply(result);
        }
    },
};
