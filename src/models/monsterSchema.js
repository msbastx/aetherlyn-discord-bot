const mongoose = require("mongoose");

const monsterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    abilities: [{ type: String }], // Optional: List of abilities
});

module.exports = mongoose.model("Monster", monsterSchema);
