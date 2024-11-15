require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.on('ready', () => {
    console.log(`Bot ${client.user.tag} está online!`);
});

client.on('messageCreate', async (message) => {
    // Ignorar mensagens do próprio bot ou de outros bots
    if (message.author.bot) return;

    const channelId = process.env.CHANNEL_ID;
    
    // Verifica se a mensagem é do canal específico
    if (message.channel.id === channelId) {
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        
        // Bloqueia mensagens que contenham links
        if (linkRegex.test(message.content)) {
            await message.delete();
            message.channel.send(`${message.author}, links não são permitidos neste canal.`);
        }
    }
});

client.login(process.env.TOKEN);
