const Player = require("../models/playerSchema");

class PlayerManager {
    static async createPlayer(userId, username) {
        const existingPlayer = await Player.findOne({ userId });
        if (existingPlayer) return { success: false, message: "❌ You are already registered as a player." };

        const newPlayer = new Player({ userId, username });
        await newPlayer.save();

        return { success: true, message: `✅ Player **${username}** has been created!` };
    }

    static async getPlayer(userId) {
        return await Player.findOne({ userId });
    }

    static async updatePlayer(userId, updateData) {
        return await Player.findOneAndUpdate({ userId }, updateData, { new: true });
    }

    static async getAllPlayers() {
        return await Player.find({});
    }
}

module.exports = PlayerManager;
