const { Events } = require("discord.js");
const Monster = require("../models/monster"); // Ensure this path is correct

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "addmonster") return;

        try {
            const focusedValue = interaction.options.getFocused();
            console.log(`🔎 Autocomplete Triggered | Input: ${focusedValue}`);

            // Fetch monsters from MongoDB that match the input
            const monsters = await Monster.find(
                { name: { $regex: new RegExp(focusedValue, "i") } }, // Case-insensitive search
                "name"
            ).limit(25);

            console.log(`📜 Monsters Found: ${monsters.map(m => m.name).join(", ") || "None"}`);

            // Format the response
            const results = monsters.map(monster => ({
                name: monster.name,
                value: monster.name
            }));

            // Respond to Discord with the list
            await interaction.respond(results.length ? results : [{ name: "No matches found", value: "none" }]);
        } catch (error) {
            console.error("❌ Autocomplete Error:", error);
            await interaction.respond([{ name: "An error occurred", value: "error" }]);
        }

        if (interaction.isButton()) {
            const { customId } = interaction;
            const sessionId = interaction.customId.split("_")[1]; // Example of extracting session ID from customId
            const session = await SessionManager.getSession(sessionId);

            if (!session || !session.battleState) {
                return interaction.reply({ content: "❌ No active battle found.", ephemeral: true });
            }

            const { participants, turnIndex } = session.battleState;
            const currentEntity = participants[turnIndex];

            if (currentEntity.type !== "Player" || currentEntity.id !== interaction.user.id) {
                return interaction.reply({ content: "❌ It's not your turn.", ephemeral: true });
            }

            switch (customId) {
                case "attack":
                    await handleAttackAction(interaction, sessionId, currentEntity);
                    break;
                case "defend":
                    await handleDefendAction(interaction, sessionId, currentEntity);
                    break;
                case "use_item":
                    await handleUseItemAction(interaction, sessionId, currentEntity);
                    break;
                default:
                    await interaction.reply({ content: "❌ Invalid action.", ephemeral: true });
            }
        }
    },
};
