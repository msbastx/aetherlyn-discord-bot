const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const MonsterManager = require("../../utils/monsterManager");
const Monster = require("../../models/monsterSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("monster")
        .setDescription("Manage monsters in the database.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName("add")
                .setDescription("Add a new monster to the database.")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Monster name")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("hp")
                        .setDescription("Monster HP")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("attack")
                        .setDescription("Monster attack damage")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("defense")  // ✅ Add defense field
                        .setDescription("Monster defense stat")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("speed")  // ✅ Add speed field
                        .setDescription("Monster speed stat")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("abilities")
                        .setDescription("Monster abilities (comma-separated)")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("list")
                .setDescription("View available monsters in the database.")
        )

        .addSubcommand(subcommand =>
            subcommand.setName("remove")
                .setDescription("Delete a specific monster from the database.")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Name of the monster to remove")
                        .setRequired(true)
                )
        ),
    
    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === "add") {
            const name = interaction.options.getString("name");
            const hp = interaction.options.getInteger("hp");
            const attack = interaction.options.getInteger("attack");
            const defense = interaction.options.getInteger("defense");  // ✅ Get defense
            const speed = interaction.options.getInteger("speed");  // ✅ Get speed
            const abilities = interaction.options.getString("abilities")?.split(",").map(a => a.trim()) || [];

            const success = await MonsterManager.addMonster(name, hp, attack, defense, speed, abilities);
            
            if (success) {
                return interaction.reply(`✅ Monster **${name}** added to the database!`);
            } else {
                return interaction.reply(`❌ Monster **${name}** already exists.`);
            }
        }

        else if (subcommand === "list") {
            const monsters = await MonsterManager.getAllMonsters();

            if (monsters.length === 0) {
                return interaction.reply("❌ No monsters available in the database.");
            }

            const monsterList = monsters.map(monster => 
                `**${monster.name}** - 📊 HP: ${monster.hp}, ⚔️ Attack: ${monster.attack}, 🛡️ Defense: ${monster.defense}, 🏃 Speed: ${monster.speed}`
            ).join("\n");

            return interaction.reply(`📃 **Monsters in the database:**\n${monsterList}`);
        }

        else if (subcommand === "remove") {
            const name = interaction.options.getString("name");

            // Check if the monster exists
            const monster = await Monster.findOne({ name });
            if (!monster) {
                return interaction.reply(`❌ Monster **${name}** not found in the database.`);
            }

            // Check if the monster is currently in use in any session
            const activeSession = await Session.findOne({ monsters: name });
            if (activeSession) {
                return interaction.reply(`⚠️ Cannot delete **${name}** because it is being used in an active session.`);
            }

            // Delete the monster
            await Monster.deleteOne({ name });
            return interaction.reply(`✅ Monster **${name}** has been removed from the database.`);
        }
    }
    
};
