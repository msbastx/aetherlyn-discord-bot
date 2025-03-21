module.exports = {
    deleted: true,
    name: 'ping',
    description: 'Replies with the bot ping!',

    callback: async (client, interaction) => {
        await interaction.deferReply();

        const reply = await interaction.fetchReply();

        const ping = reply.createdTimeStamp - interaction.createdTimeStamp;

        interaction.editReply(`Pong! Client ${ping}ms | Websocket: ${client.ws.ping}ms.`)
    },
};