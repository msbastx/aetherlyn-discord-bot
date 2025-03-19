const Monster = require("../models/monsterSchema");

class MonsterManager {
    // Add a new monster to the database
    static async addMonster(name, hp, attack, defense, speed, abilities) {
        const existingMonster = await Monster.findOne({ name });
        if (existingMonster) return false;
    
        const newMonster = new Monster({
            name, hp, attack, defense, speed, abilities
        });
    
        await newMonster.save();
        return true;
    }

    // Get a specific monster by name
    static async getMonsterByName(name) {
        return await Monster.findOne({ name });
    }

    // Get a random monster
    static async getRandomMonster() {
        const monsters = await Monster.find();
        if (monsters.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * monsters.length);
        return monsters[randomIndex];
    }

    static async getAllMonsters() {
        try {
            return await Monster.find();
        } catch (error) {
            console.log(`Error fetching monsters: ${error}`);
            return [];
        }
    }
}


module.exports = MonsterManager;
