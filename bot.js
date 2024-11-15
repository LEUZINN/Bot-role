require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, Collection, ActivityType } = require('discord.js');
const express = require('express');

// Inicialização do Express para rodar na porta 80
const app = express();
const port = 80;

// Inicialização do bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
});

// Coleção para armazenar os IDs dos canais bloqueados
const blockedChannels = new Collection();

client.on('ready', () => {
    console.log(`Bot ${client.user.tag} está online!`);

    // Definindo um status para o bot
    client.user.setActivity('Moderando links!', { type: ActivityType.Watching });

    // Inicia o servidor Express na porta 80
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
});

// Evento para bloquear links
client.on('messageCreate', async (message) => {
    // Ignorar mensagens de bots
    if (message.author.bot) return;

    // Verificar se o canal está bloqueado
    const isBlockedChannel = blockedChannels.has(message.channel.id);
    if (isBlockedChannel) {
        const linkRegex = /(https?:\/\/[^\s]+)/g;

        // Verificar se a mensagem contém um link
        if (linkRegex.test(message.content)) {
            // Se o usuário for administrador
            if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                // Responder apenas para o autor da mensagem (usando uma mensagem efêmera)
                await message.reply({
                    content: `Links não são permitidos neste canal. Você é administrador e pode ignorar esta regra.`,
                    ephemeral: true // Apenas o autor da mensagem verá isso
                });
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
        if (!blockedChannels.has(channel.id)) {
            blockedChannels.set(channel.id, channel.name);
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

client.login(process.env.TOKEN);
