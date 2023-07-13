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

// STILL IN PROGRESS
// class UserInfo{
//     constructor(is_devo, view_streak, streaks){
//         this.is_devo = is_devo;
//         this.view_streak = view_streak;
//         this.streaks = streaks;
//     }
// }

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October","November","December"];
// Maps a user class to a UserInfo.
const member_devo = new Map();

//cron.schedule('* * * * *', function() {
cron.schedule('0 4 * * *', function() {
    var date = new Date();
    client.channels.cache.get(process.env.CHANNEL_ID).send(`***[${monthNames[date.getMonth()]} ${date.getDate()}] Daily Accountability Check:***`);
    
    //Check for new users who didn't send a devotional yet  //Issue: For a user that joined that day and not sent a message yet, it will not include them in the checklist.
    // Possible solution: check when a user enters the server.
    client.guilds.cache.get(process.env.GUILD_ID).members.fetch().then((memberMap) => {
        for(let [id, GuildMember] of memberMap){
            if(!GuildMember.user.bot){
                if(!member_devo.has(GuildMember.user)){
                    member_devo.set(GuildMember.user, 0);
                    console.log(`Added ${GuildMember.user.username} with 0.`);
                }
            }
        }
    }).catch(console.error);
    
    for(let [user, is_devo] of member_devo){
        if(is_devo === 0){
            console.log(`${user.username} did not do their devotion.`);
            client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: Reminder to do your devotion.`);
        }
        else if(is_devo === 2){
            client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: Encouragement to go more in-depth with your devotion.`);
        }
        else{
            //console.log(`${user.username} did do their devotion.`);
            client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: ✅`);
        }
        member_devo.set(user, 0);

    }
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
});


client.on('messageCreate', (message) => {
    if(message.channelId !== process.env.CHANNEL_ID){
        return;
    }
    else if (message.author.bot) {
        return;
    }
    else{
        for(let [user, is_devo] of member_devo){
            if(user.id === message.author.id){
                if(is_devo === 1){
                    member_devo.set(user, 1);
                }
                else if(message.content.length <= 200){
                    if(is_devo === 0){
                        console.log(`${user.username} wrote a short devotion.`);
                    }
                    member_devo.set(user, 2);
                }
                else{
                    member_devo.set(user, 1);
                    console.log(`${user.username} did do their devotion.`);
                }
                return;
            }
        }
        // If New User Joins In and sends a devotion
        if(message.content.length <= 200){
            member_devo.set(message.author, 2);
            console.log(`Added ${message.author.username} with 2.`);
        }
        else{
            member_devo.set(message.author, 1);
            console.log(`Added ${message.author.username} with 1.`);
        }
        
    }
    //console.log(message.content)
})

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! STILL UNDER PROCESS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    

    if(interaction.commandName === 'set_devotion') {
        command_set_devotion(interaction);
    }
    else if(interaction.commandName === 'toggle_streak'){
        command_toggle_streak(interaction);
    }
})

function command_set_devotion(interaction){
    if(interaction.channelId !== process.env.TEST_CHANNEL_ID) return;
    const user_encased = interaction.options.get('user');
    const value_encased = interaction.options.get('value');

    const user = user_encased.user;
    const value = value_encased.value;
    //console.log(user);
    //console.log(value);
    member_devo.set(user, value);
    console.log(`Set ${user.username} to ${value}.`);

    return;
}

// STILL IN PROGRESS
function command_toggle_streak(interaction){
    return;
}

//client.login(process.env.TOKEN);

client.login(process.env.TOKEN).then(() => {
    console.log("I am ready");
    client.guilds.cache.get(process.env.GUILD_ID).members.fetch().then((memberMap) => {
        for(let [id, GuildMember] of memberMap){
            if(!GuildMember.user.bot){
                // STILL IN PROGRESS
                //var user_info = UserInfo(0, true, 0);
                member_devo.set(GuildMember.user, 0);
            }
        }
    }).catch(console.error);
    
});

// 0 - false
// 1 - true
// 2 - did devo but too short