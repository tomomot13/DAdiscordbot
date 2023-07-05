require('dotenv').config();
const { Client, IntentsBitField} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages
        
    ]
})

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
});

// ___________Lesson 1______________
// client.on('messageCreate', (message) => {
//     if (message.author.bot) {
//         return;
//     }
//     console.log(message.content)
// })

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'hey') {
        interaction.reply('hey!');
    }
})

client.login(process.env.TOKEN);

