require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, Collection, ActivityType } = require('discord.js');
const express = require('express');
const fs = require('fs');

// Inicialização do Express para rodar na porta 80
const app = express();
const port = 80;

// Inicialização do bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
});

// Carregar os canais bloqueados do arquivo JSON
let blockedChannels = require('./blockedChannels.json');

// Função para salvar o arquivo JSON com os canais bloqueados
const saveBlockedChannels = () => {
    fs.writeFileSync('./blockedChannels.json', JSON.stringify(blockedChannels, null, 2));
};

// Inicia o servidor Express na porta 80
client.on('ready', () => {
    console.log(`Bot ${client.user.tag} está online!`);

    // Definindo um status para o bot
    client.user.setActivity('Moderando links!', { type: ActivityType.Watching });

    // Inicia o servidor Express na porta 80
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });

    // Manter o bot ativo a cada minuto (ping)
    setInterval(() => {
        console.log('Bot está ativo');
    }, 1000 * 60); // Loga a cada minuto
});

// Evento para bloquear links
client.on('messageCreate', async (message) => {
    // Ignorar mensagens de bots
    if (message.author.bot) return;

    // Verificar se o canal está bloqueado
    if (blockedChannels.includes(message.channel.id)) {
        const linkRegex = /(https?:\/\/[^\s]+)/g;

        // Verificar se a mensagem contém um link
        if (linkRegex.test(message.content)) {
            // Ignorar mensagens de admins
            if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return;
            }

            // Para outros usuários, deletar a mensagem e enviar um aviso por DM
            await message.delete();
            await message.author.send(`Links não são permitidos no canal **${message.channel.name}**.`);
        }
    }
});

// Comando para adicionar canais bloqueados
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'add') {
        const channel = options.getChannel('canal');

        // Verificar se o usuário tem permissão para usar o comando
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true
            });
        }

        // Adicionar o canal à lista de bloqueados
        if (!blockedChannels.includes(channel.id)) {
            blockedChannels.push(channel.id);
            saveBlockedChannels();  // Salvar no arquivo JSON
            return interaction.reply({
                content: `Canal **${channel.name}** foi adicionado à lista de canais com bloqueio de links.`,
                ephemeral: true
            });
        } else {
            return interaction.reply({
                content: `O canal **${channel.name}** já está na lista de bloqueados.`,
                ephemeral: true
            });
        }
    }
});

// Registro dos comandos
client.on('ready', async () => {
    const guild = client.guilds.cache.first(); // Substitua pelo ID da guild se necessário
    if (!guild) return;

    // Registrar comando `/add`
    await guild.commands.create({
        name: 'add',
        description: 'Adiciona um canal para bloquear links.',
        options: [
            {
                name: 'canal',
                type: 7, // CHANNEL
                description: 'O canal que será bloqueado.',
                required: true
            }
        ]
    });

    console.log('Comando /add registrado com sucesso!');
});

// Rota simples para garantir que o servidor Express está funcionando
app.get('/', (req, res) => {
    res.send('Bot está online!');
});

// Reconectar automaticamente caso o bot perca a conexão com o Discord
client.on('disconnect', () => {
    console.log('Bot foi desconectado, tentando reconectar...');
});

client.on('reconnecting', () => {
    console.log('Bot tentando reconectar...');
});

client.login(process.env.TOKEN);
