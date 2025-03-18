const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const MonsterManager = require("../../utils/monsterManager");

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
                .addStringOption(option =>
                    option.setName("abilities")
                        .setDescription("Monster abilities (comma-separated)")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("list")
                .setDescription("View available monsters in the database.")
        ),
    
    async run({ interaction }) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === "add") {
            const name = interaction.options.getString("name");
            const hp = interaction.options.getInteger("hp");
            const attack = interaction.options.getInteger("attack");
            const abilities = interaction.options.getString("abilities")?.split(",").map(a => a.trim()) || [];

            const success = await MonsterManager.addMonster(name, hp, attack, abilities);
            
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

            const monsterList = monsters.map(monster => `**${monster.name}** - 📊 HP: ${monster.hp}, ⚔️ Attack: ${monster.attack}`).join("\n");

            return interaction.reply(`📃 **Monsters in the database:**\n${monsterList}`);
        }
    }
};
