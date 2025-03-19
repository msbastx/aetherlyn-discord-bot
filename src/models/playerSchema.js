const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    hp: { type: Number, required: true, default: 100 },
    attack: { type: Number, required: true, default: 10 },
    defense: { type: Number, required: true, default: 5 },
    speed: { type: Number, required: true, default: 10 },
    isInSession: { type: Boolean, default: false },
});

module.exports = mongoose.model("Player", playerSchema);