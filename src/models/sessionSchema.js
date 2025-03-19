const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    moderatorId: { type: String, required: true },
    players: { type: [String], default: [] }, // ✅ Players should be an array
    monsters: { type: [Object], default: [] }, // ✅ Ensure this is an array
    battleState: { type: Object, default: {} }, // ✅ Use an object to store battle state
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model("Session", sessionSchema);
