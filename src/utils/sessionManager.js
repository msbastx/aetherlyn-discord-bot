const Session = require("../models/sessionSchema");
const MonsterManager = require("./monsterManager");
const Monster = require("../models/monsterSchema");
const crypto = require("crypto");

class SessionManager {
    async createSession(sessionId, moderatorId) {
        const existingSession = await Session.findOne({ moderatorId });
        if (existingSession) return false; // Prevent multiple sessions per moderator

        await Session.create({ sessionId, moderatorId, players: [] });
        return true;
    }

    async joinSession(sessionId, userId) {
        const session = await Session.findOne({ sessionId });
    
        if (!session) return false; // Session not found
    
        if (!session.players) session.players = []; // Ensure it's an array
        if (!session.players.includes(userId)) {
            session.players.push(userId);
            await session.save();
            console.log(`✅ User ${userId} joined session ${sessionId}. Updated players:`, session.players);
        } else {
            console.log(`⚠️ User ${userId} is already in session ${sessionId}`);
        }
    
        return true;
    }

    static async leaveSession(sessionId, playerId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        session.players = session.players.filter((id) => id !== playerId);
        await session.save();
        return true;
    }

    static async endSession(sessionId) {
        await Session.deleteOne({ sessionId });
        return true;
    }

    static async getSession(sessionId) {
        const session = await Session.findOne({ sessionId });
        if (!session) {
            console.log("Session not found.");
            return null;
        }
    
        console.log("Retrieved session:", session);
        return session;
    }

    // Add a random monster from the database
    static async addRandomMonster(sessionId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return "❌ Session not found.";
    
        const monster = await Monster.findOne().sort({ _id: -1 }); // Get a random monster
        if (!monster) return "❌ No monsters available in the database.";
    
        const monsterInstance = {
            name: monster.name,
            hp: monster.hp,
            attack: monster.attack,
            defense: monster.defense || 0,
            speed: monster.speed || 0,
            abilities: monster.abilities || [],
            id: crypto.randomBytes(2).toString("hex"),
        };
    
        // ✅ Ensure `monsters` and `turnOrder` exist as arrays
        if (!Array.isArray(session.monsters)) session.monsters = [];
        if (!Array.isArray(session.turnOrder)) session.turnOrder = [];
    
        session.monsters.push(monsterInstance);
        session.turnOrder.push(monsterInstance.id);
        await session.save();
    
        return `👹 A wild **${monster.name}** appears!`;
    }

    // Add a specific monster by name from the database
    static async addMonsterByName(sessionId, monsterName) {
        const session = await Session.findOne({ sessionId }).select("monsters turnOrder");
        if (!session) return false;
    
        const monster = await Monster.findOne({ name: monsterName });
        if (!monster) return `❌ No monster named **${monsterName}** found.`;
    
        const monsterInstance = {
            name: monster.name,
            hp: monster.hp,
            attack: monster.attack,
            defense: monster.defense || 0,
            speed: monster.speed || 0,
            abilities: monster.abilities || [],
            id: crypto.randomBytes(2).toString("hex"),
        };
    
        await Session.updateOne(
            { sessionId },
            { 
                $push: { 
                    monsters: monsterInstance, 
                    turnOrder: monsterInstance.id 
                } 
            }
        );
    
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

    static async setBattleState(sessionId, battleState) {
        const session = await Session.findOne({ sessionId });
        if (!session) {
            console.log("Session not found.");
            return false;
        }
    
        session.battleState = battleState;
        await session.save();
        console.log("Battle state saved:", session.battleState);
        return true;
    }

    static async endBattle(sessionId) {
        const session = await Session.findOne({ sessionId });
        if (!session) return false;

        // Clear the battle state
        session.battleState = null;
        await session.save();

        return true;
    }
}

module.exports = SessionManager;