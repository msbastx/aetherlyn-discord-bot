const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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

    // Fetch all players in a single query
    for (const playerId of session.players) {
        const playerData = await Player.findOne({ userId: playerId }).catch((err) => {
            console.error("Error fetching player:", err);
            return null;
        });

        if (!playerData) {
            console.log(`Player ${playerId} not found in the database.`);
            continue;
        }

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

    // Fetch all monsters in a single query
    const monsterNames = session.monsters.map((m) => m.name);
    const monsterData = await Monster.find({ name: { $in: monsterNames } }).catch((err) => {
        console.error("Error fetching monsters:", err);
        return [];
    });

    // Add monsters to participants
    monsterData.forEach((monster) => {
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

    console.log("Participants:", participants);

    if (participants.length === 0) {
        throw new Error("No players or monsters found in the session.");
    }

    // Sort participants by Speed stat (higher Speed goes first)
    const turnOrder = participants
        .sort((a, b) => b.speed - a.speed)
        .map((entity) => entity.id);

    console.log("Turn Order:", turnOrder);

    // Save battle state
    console.log("Participants: ", participants);
    await SessionManager.setBattleState(sessionId, { participants, turnIndex: 0 });
    await handleTurn(interaction, sessionId);

    // Separate players and monsters from participants
    const players = participants.filter((p) => p.type === "Player");
    const monsters = participants.filter((p) => p.type === "Monster");

    console.log("Players:", players);
    console.log("Monsters:", monsters);

    // Create and send embed
    const battleEmbed = createBattleEmbed(players, monsters, turnOrder);

    if (interaction.deferred) {
        await interaction.editReply({ embeds: [battleEmbed] });
    } else {
        await interaction.reply({ embeds: [battleEmbed] });
    }
}

function createBattleEmbed(players = [], monsters = [], turnOrder = []) {
    console.log("Players:", players);
    console.log("Monsters:", monsters);
    console.log("Turn Order:", turnOrder);

    if (!Array.isArray(turnOrder)) {
        throw new Error("turnOrder must be an array.");
    }

    const embed = new EmbedBuilder()
        .setTitle("Battle Status")
        .setColor("#00FF00")
        .addFields(
            {
                name: "Players",
                value: players.length > 0
                    ? players.map((player) => `[${turnOrder.includes(player.id) ? "x" : " "}] ${player.name}\nHP: ${player.hp} | ATK: ${player.attack} | DEF: ${player.defense} | SPD: ${player.speed}`).join("\n")
                    : "No players in the battle.",
                inline: true,
            },
            {
                name: "Monsters",
                value: monsters.length > 0
                    ? monsters.map((monster) => `[${turnOrder.includes(monster.id) ? "x" : " "}] ${monster.name}\nHP: ${monster.hp} | ATK: ${monster.attack} | DEF: ${monster.defense} | SPD: ${monster.speed}`).join("\n")
                    : "No monsters in the battle.",
                inline: true,
            }
        )
        .addFields(
            {
                name: "Turn Order",
                value: turnOrder.length > 0
                    ? turnOrder.map((id, index) => `${index + 1}. ${players.concat(monsters).find((entity) => entity.id === id)?.name}`).join("\n")
                    : "No turn order available.",
            }
        );

    return embed;
}

// Create embeds and action rows
function createPlayerTurnEmbed(player) {
    return new EmbedBuilder()
        .setTitle(`🎮 ${player.name}'s Turn`)
        .setDescription("Choose your action:")
        .setColor("#00FF00");
}

function createPlayerActionRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("attack")
            .setLabel("Attack")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("defend")
            .setLabel("Defend")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("use_item")
            .setLabel("Use Item")
            .setStyle(ButtonStyle.Success)
    );
}

function createMonsterTurnEmbed(monster) {
    return new EmbedBuilder()
        .setTitle(`👹 ${monster.name}'s Turn`)
        .setDescription("The monster is preparing to attack...")
        .setColor("#FF0000");
}

// Handle the turn logic
async function handleTurn(interaction, sessionId) {
    const session = await SessionManager.getSession(sessionId);
    if (!session || !session.battleState) {
        return interaction.followUp({ content: "❌ No active battle found.", ephemeral: true });
    }

    const { participants, turnIndex } = session.battleState;
    const currentEntity = participants[turnIndex];

    if (!currentEntity) {
        return interaction.followUp({ content: "❌ No entities found in the battle.", ephemeral: true });
    }

    if (currentEntity.type === "Player") {
        // Send an embed to the player
        const playerTurnEmbed = createPlayerTurnEmbed(currentEntity);
        const actionRow = createPlayerActionRow();

        await interaction.followUp({
            content: `<@${currentEntity.id}>, it's your turn!`,
            embeds: [playerTurnEmbed],
            components: [actionRow],
        });
    } else if (currentEntity.type === "Monster") {
        // Send a global embed for the monster's turn
        const monsterTurnEmbed = createMonsterTurnEmbed(currentEntity);

        await interaction.followUp({
            content: "👹 It's the monster's turn!",
            embeds: [monsterTurnEmbed],
        });

        // Simulate the monster's action
        await handleMonsterAction(interaction, sessionId, currentEntity);
    }

    // Update the turn index for the next turn
    const nextTurnIndex = (turnIndex + 1) % participants.length;
    await SessionManager.setBattleState(sessionId, { participants, turnIndex: nextTurnIndex });
}

// Handle monster actions
async function handleMonsterAction(interaction, sessionId, monster) {
    const session = await SessionManager.getSession(sessionId);
    if (!session || !session.battleState) {
        return interaction.followUp({ content: "❌ No active battle found.", ephemeral: true });
    }

    const { participants } = session.battleState;

    // Find a random player to attack
    const players = participants.filter((p) => p.type === "Player");
    if (players.length === 0) {
        return interaction.followUp({ content: "❌ No players found in the battle.", ephemeral: true });
    }

    const targetPlayer = players[Math.floor(Math.random() * players.length)];

    // Simulate the monster's attack
    const damage = Math.max(0, monster.attack - targetPlayer.defense);
    targetPlayer.hp -= damage;

    // Update the battle state
    await SessionManager.setBattleState(sessionId, { participants, turnIndex: session.battleState.turnIndex });

    // Send the result of the monster's action
    await interaction.followUp({
        content: `👹 **${monster.name}** attacked **${targetPlayer.name}** for **${damage}** damage!`,
    });

    // Check if the player is defeated
    if (targetPlayer.hp <= 0) {
        await interaction.followUp({
            content: `💀 **${targetPlayer.name}** has been defeated!`,
        });
    }
}

module.exports = { startBattle, createBattleEmbed, handleMonsterAction };