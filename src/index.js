require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { CommandKit } = require("commandkit");
const mongoose = require("mongoose");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// MongoDB Connection
(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB.");

        // Initialize CommandKit
        new CommandKit({
            client,
            commandsPath: path.join(__dirname, "commands"),
            eventsPath: path.join(__dirname, "events"),
            guildId: process.env.GUILD_ID,
            bulkRegister: true, // Registers all commands at once
        });

        client.login(process.env.TOKEN);

    } catch (error) {
        console.log(`❌ Error: ${error}.`);
    }
})();
