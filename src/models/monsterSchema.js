const mongoose = require("mongoose");

const monsterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    speed: { type: Number, required: true },  // Determines turn order
    abilities: { type: [String], default: [] }
});

module.exports = mongoose.model("Monster", monsterSchema);
