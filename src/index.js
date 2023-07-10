require('dotenv').config();
const cron = require('node-cron');
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

const member_devo = new Map();

cron.schedule('0 4 * * *', function() {
    client.channels.cache.get(process.env.CHANNEL_ID).send("Good Morning.");
    for(let [user, is_devo] of member_devo){
        if(is_devo === 0){
            console.log(`${user.username} did not do their devotion.`);
            client.channels.cache.get(process.env.CHANNEL_ID).send(`${user} Reminder to do your devotion.`);
        }
        else if(is_devo === 2){
            console.log(`${user.username} wrote a short devotion.`);
            client.channels.cache.get(process.env.CHANNEL_ID).send(`${user} Encouragement to go more in-depth with your devotion.`);
        }
        else{
            console.log(`${user.username} did do their devotion.`);
            //client.channels.cache.get(process.env.CHANNEL_ID).send(`${user.username} did do their devotion.`);
        }
        member_devo.set(user, 0);

    }
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
});

// ___________Lesson 1______________
client.on('messageCreate', (message) => {
    if (message.author.bot) {
        return;
    }
    else{
        for(let [user, is_devo] of member_devo){
            if(user.id === message.author.id){
                if(is_devo === 1){
                    member_devo.set(user, 1);
                }
                else if(message.content.length <= 200){
                    member_devo.set(user, 2);
                }
                else{
                    member_devo.set(user, 1);
                }
            }
        }
    }
    //console.log(message.content)
})

// client.on('interactionCreate', (interaction) => {
//     if (!interaction.isChatInputCommand()) return;

//     if(interaction.commandName === 'hey') {
//         interaction.reply('hey!');
//     }
// })

//client.login(process.env.TOKEN);

client.login(process.env.TOKEN).then(() => {
    console.log("I am ready");
    client.guilds.cache.get(process.env.GUILD_ID).members.fetch().then((memberMap) => {
        for(let [id, GuildMember] of memberMap){
            if(!GuildMember.user.bot){
                member_devo.set(GuildMember.user, 0);
            }
        }
    }).catch(console.error);
    
});

// 0 - false
// 1 - true
// 2 - did devo but too short