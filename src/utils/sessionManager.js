const Session = require("../models/sessionSchema");
const MonsterManager = require("./monsterManager");

class SessionManager {
    async createSession(sessionId, moderatorId) {
        const existingSession = await Session.findOne({ moderatorId });
        if (existingSession) return false; // Prevent multiple sessions per moderator

        await Session.create({ sessionId, moderatorId, players: [] });
        return true;
    }

    async joinSession(sessionId, playerId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        if (!session.players.includes(playerId)) {
            session.players.push(playerId);
            await session.save();
        }
        return true;
    }

    async leaveSession(sessionId, playerId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        session.players = session.players.filter((id) => id !== playerId);
        await session.save();
        return true;
    }

    async endSession(sessionId) {
        await Session.deleteOne({ sessionId });
        return true;
    }

    async getSession(sessionId) {
        return await Session.findOne({ sessionId });
    }

    // Add a random monster from the database
    static async addRandomMonster(sessionId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        const monster = await MonsterManager.getRandomMonster();
        if (!monster) return "❌ No monsters available in the database.";

        const monsterInstance = {
            name: monster.name,
            hp: monster.hp,
            attack: monster.attack,
            id: crypto.randomBytes(2).toString("hex"),
        };

        session.monsters.push(monsterInstance);
        session.turnOrder.push(monsterInstance.id);
        await session.save();

        return `👹 A wild **${monster.name}** appears!`;
    }

    // Add a specific monster by name from the database
    static async addMonsterByName(sessionId, monsterName) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        const monster = await MonsterManager.getMonsterByName(monsterName);
        if (!monster) return `❌ No monster named **${monsterName}** found in the database.`;

        const monsterInstance = {
            name: monster.name,
            hp: monster.hp,
            attack: monster.attack,
            id: crypto.randomBytes(2).toString("hex"),
        };

        session.monsters.push(monsterInstance);
        session.turnOrder.push(monsterInstance.id);
        await session.save();

        return `👹 **${monster.name}** joins the battle!`;
    }

    static async getActiveSession(userId) {
        return await Session.findOne({ moderatorId: userId, active: true });
    }

    static async addMonsterToSession(sessionId, monster) {
        return await Session.findOneAndUpdate(
            { sessionId },
            { $push: { monsters: monster} },
            { new: true }
        );
    }
}

module.exports = SessionManager;