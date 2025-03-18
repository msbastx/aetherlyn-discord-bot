const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('roll').setDescription('Rolls dice.').addStringOption(option => option.setName('dice').setDescription('The dice to roll.').setRequired(true)),
    run: async ({ interaction, client, handler }) => {
        const input = interaction.options.getString('dice');
        const diceRegex = /^(\d+)?d(\d+)([+-]\d+)?$/;
        const match = input.match(diceRegex);

        if (!match) {
            return interaction.reply({ content: 'Invalid dice format.', ephemeral: true });
        }

        let [, numDice, diceSides, modifier] = match;
        numDice = parseInt(numDice) || 1;
        diceSides = parseInt(diceSides);
        modifier = modifier ? parseInt(modifier): 0;

        //Roll the dice.
        let rolls = [];
        let total = 0;
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceSides) + 1;
            rolls.push(roll);
            total += roll;
        }

        total += modifier;

        //Reply with the result.
        await interaction.reply(`Rolled ${numDice}d${diceSides}${modifier ? modifier : ''}:\n${rolls.join(', ')}\nTotal: ${total}`);
    },
    options: {
        botPermissions: ['Administrator'],
    },
};