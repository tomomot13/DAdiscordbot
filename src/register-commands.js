require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'set_devotion',
        description: '[For Testing] Sets devotion of a user to specified value.',
        options: [
            {
                name: 'user',
                description: 'The user to set devotion.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'value',
                description: 'Value of devotion.',
                type: ApplicationCommandOptionType.Integer,
                required: true
            }
        ]
    },
    {
        name: 'set_streak',
        description: '[For Testing] Sets streak of a user to specified value.',
        options: [
            {
                name: 'user',
                description: 'The user to set streak.',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'value',
                description: 'Value of streak.',
                type: ApplicationCommandOptionType.Integer,
                required: true
            }
        ]
    },
    {
        name: 'toggle_streak',
        description: 'Toggle to make streaks visible or not visible.'
    }
];

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);

(async () =>{
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )
        console.log('Slash command were registered successfully!')
    } catch (error){
        console.log(`There was an error: ${error}`);
    }
})()