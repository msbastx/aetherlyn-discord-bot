const { EmbedBuilder } = require("discord.js");
const Player = require("../models/playerSchema");
const Monster = require("../models/monsterSchema");
const SessionManager = require("./sessionManager");

async function startBattle(interaction, sessionId) {
    if (!interaction) {
        console.log("Interaction not provided.");
        return;
    }

    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const session = await SessionManager.getSession(sessionId);
    if (!session) {
        await interaction.editReply({ content: "❌ Session not found.", ephemeral: true }); 
        return;
    }

    console.log(`🔍 Players in session ${sessionId}: `, session.players);

    let participants = [];

    // ✅ Fetch all players in a single query
    for (const playerId of session.players) {
        const playerData = await Player.findOne({ userId: playerId });

        console.log(`🔍 Fetching player: ${playerId} | Found:`, playerData);

        if (playerData) {
            participants.push({
                type: "Player",
                id: playerData.userId,
                name: playerData.username,
                hp: playerData.hp,
                attack: playerData.attack,
                defense: playerData.defense,
                speed: playerData.speed,
            });
        }
    }

    // ✅ Fetch all monsters in a single query
    const monsterNames = session.monsters.map(m => m.name);
    const monsterData = await Monster.find({ name: { $in: monsterNames } });

    // ✅ Add monsters to participants
    monsterData.forEach(monster => {
        participants.push({
            type: "Monster",
            id: monster.name,
            name: monster.name,
            hp: monster.hp,
            attack: monster.attack,
            defense: monster.defense,
            speed: monster.speed,
        });
    });

    // Sort participants by Speed stat (higher Speed goes first)
    participants.sort((a, b) => b.speed - a.speed);

    // Save battle state
    const sessionManager = new SessionManager(); // ✅ Create an instance
    await sessionManager.setBattleState(sessionId, { participants, turnIndex: 0 });
    
    // Create and send embed
    const battleEmbed = createBattleEmbed(participants);

    if (interaction.deferred) {
        await interaction.editReply({ embeds: [battleEmbed] });
    } else {
        await interaction.reply({ embeds: [battleEmbed] });
    }
}

// Function to generate an embed for battle status
function createBattleEmbed(participants) {
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return new EmbedBuilder()
            .setTitle("⚔️ Battle Status")
            .setDescription("No active participants in the battle.")
            .setColor(0xff0000);
    }

    const embed = new EmbedBuilder()
        .setTitle("⚔️ Battle Status")
        .setDescription("Turn Order (Based on Speed):")
        .setColor(0xff0000);

    participants.forEach((p, index) => {
        embed.addFields({
            name: `${index + 1}. ${p.type === "Player" ? `🛡️ ${p.name}` : `👹 ${p.name}`}`,
            value: `❤️ HP: ${p.hp} | ⚔️ ATK: ${p.attack} | 🛡️ DEF: ${p.defense} | 🏃 SPD: ${p.speed}`,
            inline: false,
        });
    });

    return embed;
}

module.exports = { startBattle, createBattleEmbed };
