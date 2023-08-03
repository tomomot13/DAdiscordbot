require('dotenv').config();
require('console-stamp')(console, 'HH:MM:ss');
const cron = require('node-cron');
const { Client, IntentsBitField} = require('discord.js');
const fs = require('fs');

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
class UserInfo{
    constructor(id, username, is_devo, view_streak, streaks){
        this.id = id;
        this.username = username;
        this.is_devo = is_devo;
        this.view_streak = view_streak;
        this.streaks = streaks;
    }
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October","November","December"];
// Maps a GuildMemberUser class to a UserInfo.
const member_devo = new Map();

//cron.schedule('* * * * *', function() {
cron.schedule('0 4 * * *', function() {
    var date = new Date();
    var message = `***[${monthNames[date.getMonth()]} ${date.getDate()}] Daily Accountability Check:***\n`;
    //client.channels.cache.get(process.env.CHANNEL_ID).send(`***[${monthNames[date.getMonth()]} ${date.getDate()}] Daily Accountability Check:***`);
    
    //Check for new users who didn't send a devotional yet  //Issue: For a user that joined that day and not sent a message yet, it will not include them in the checklist.
    // Possible solution: check when a user enters the server.
    client.guilds.cache.get(process.env.GUILD_ID).members.fetch().then((memberMap) => {
        for(let [id, GuildMember] of memberMap){
            if(!GuildMember.user.bot){
                if(!member_devo.has(GuildMember.user)){
                    // ADD NEW USER TO CSV FILE
                    //member_devo.set(GuildMember.user, 0);
                    console.log(`Added ${GuildMember.user.username} with 0.`);
                }
            }
        }
    }).catch(console.error);
    
    for(let [user, user_info] of member_devo){
        if(user_info.is_devo === 0){
            
            user_info.streaks = 0;

            message += `${user}: Reminder to do your devotion.`;
            if(user_info.view_streak){
                message += ` 📖: ${user_info.streaks}`;
            }
            message += '\n';
            //client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: Reminder to do your devotion.`);

            console.log(`${user.username} did not do their devotion.`);
        }
        else if(user_info.is_devo === 2){
            message += `${user}: Encouragement to go more in-depth with your devotion.`;

            user_info.streaks++;
            if(user_info.view_streak){
                message += ` 📖: ${user_info.streaks}`;
            }
            message += '\n';
            //client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: Encouragement to go more in-depth with your devotion.`);
        }
        else{
            //console.log(`${user.username} did do their devotion.`);
            message += `${user}:  ✅`;

            user_info.streaks++;
            if(user_info.view_streak){
                message += `  📖: ${user_info.streaks}`;
            }
            message += '\n';
            //client.channels.cache.get(process.env.CHANNEL_ID).send(`${user}: ✅`);
        }
        user_info.is_devo = 0;
        member_devo.set(user, user_info);
        UpdateFile();

    }
    client.channels.cache.get(process.env.CHANNEL_ID).send(message);
    console.log(message);
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
        for(let [user, user_info] of member_devo){
            if(user.id === message.author.id){
                if(message.attachments.size > 0){
                    user_info.is_devo = 1;
                    member_devo.set(user, user_info);
                    console.log(`${user.username} did do their devotion with a file.`);
                    UpdateFile();
                }
                if(user_info.is_devo === 1){
                    user_info.is_devo = 1;
                    member_devo.set(user, user_info);
                }
                else if(message.content.length <= 200){
                    if(user_info.is_devo === 0){
                        console.log(`${user.username} wrote a short devotion.`);
                    }
                    user_info.is_devo = 2;
                    member_devo.set(user, user_info);
                    UpdateFile();
                }
                else{
                    user_info.is_devo = 1;
                    member_devo.set(user, user_info);
                    console.log(`${user.username} did do their devotion.`);
                    UpdateFile();
                }
                return;
            }
        }
        // If New User Joins In and sends a devotion
        if(message.content.length <= 200){
            let user_info = new UserInfo(message.author.id, message.author.username, 2, true, 0);
            member_devo.set(message.author, user_info);
            console.log(`Added ${message.author.username} with 2.`);
        }
        else{
            let user_info = new UserInfo(message.author.id, message.author.username, 1, true, 0);
            member_devo.set(message.author, user_info);
            console.log(`Added ${message.author.username} with 1.`);
        }
        UpdateFile();
        
    }
    //console.log(message.content)
})

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! STILL UNDER PROCESS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'set_devotion') {
        command_set_devotion(interaction);
    }
    else if(interaction.commandName === 'set_streak'){
        command_set_streak(interaction);
    }
    else if(interaction.commandName === 'toggle_streak'){
        command_toggle_streak(interaction);
    }
})

// It is a command to manually override the data of who did their devotion that day. It is mainly used for testing and when server side crashes causing to lose data for that day.
function command_set_devotion(interaction){
    if(interaction.channelId !== process.env.TEST_CHANNEL_ID) return;
    const user_encased = interaction.options.get('user');
    const value_encased = interaction.options.get('value');

    const user = user_encased.user;
    const value = value_encased.value;
    //console.log(user);
    //console.log(value);
    let user_info = member_devo.get(user);
    user_info.is_devo = value;
    member_devo.set(user, user_info);
    UpdateFile();
    console.log(`Set ${user.username} to is_devo = ${value}.`);

    return;
}

function command_set_streak(interaction){
    if(interaction.channelId !== process.env.TEST_CHANNEL_ID) return;
    const user_encased = interaction.options.get('user');
    const value_encased = interaction.options.get('value');

    const user = user_encased.user;
    const value = value_encased.value;
    //console.log(user);
    //console.log(value);
    let user_info = member_devo.get(user);
    user_info.streaks = value;
    member_devo.set(user, user_info);
    UpdateFile();
    console.log(`Set ${user.username} to streaks = ${value}.`);
}

function command_toggle_streak(interaction){
    //console.log(interaction);
    let user = interaction.user;
    let user_info = member_devo.get(user);
    if(user_info.view_streak){
        user_info.view_streak = false;
        console.log(`${user.username} set their view_streak = false.`);
        interaction.reply(`${user} set streaks to hidden.`);
    }
    else{
        user_info.view_streak = true;
        console.log(`${user.username} set their view_streak = true.`);
        interaction.reply(`${user} set streaks to visible.`);
    }
    UpdateFile();
    return;
}

//client.login(process.env.TOKEN);

var users_info = [];

function UpdateFile(){
    let output = "id,username,is_devo,view_streak,streak_count\n";
    for(let [user,user_info] of member_devo){
        output += userInfoToCSV(user_info);
    }
    fs.writeFile('data.txt', output, (err) => {
        if (err) throw err;
        else{
           //console.log("Updated File.");
        }
     })
}

//Splits file contents per line into an array, users_info. The first element of array is header. The last element of array is empty string.
function processFile(text){
    let line_by_line_arr = (text.toString()).split('\n');

    for(let i = 1; i < line_by_line_arr.length - 1; i++){
        let line_arr = line_by_line_arr[i].split(",");

        let view_streak = false;
        if(line_arr[3] === "true"){
            view_streak = true;
        }

        let user_info = new UserInfo(line_arr[0],line_arr[1],parseInt(line_arr[2]),view_streak,parseInt(line_arr[4]));
        //console.log(user_info);
        users_info.push(user_info);
    }
}

function userInfoToCSV(user_info){
    let output = "";
    output += `${user_info.id},`;
    output += `${user_info.username},`;
    output += `${user_info.is_devo.toString()},`;
    output += `${user_info.view_streak.toString()},`;
    output += `${user_info.streaks.toString()}\n`;
    return output;
}

client.login(process.env.TOKEN).then(() => {
    console.log("I am ready");

    fs.readFile('data.txt', (err, text) => {
        if (err) return;
            //console.log(text.toString());
        processFile(text.toString());
    })


    let input = 'id,username,is_devo,view_streak,streak_count\n';
    client.guilds.cache.get(process.env.GUILD_ID).members.fetch().then((memberMap) => {
        for(let [id, GuildMember] of memberMap){
            if(!GuildMember.user.bot){
                // STILL IN PROGRESS
                for(let user_info of users_info){
                    if(id === user_info.id){
                        member_devo.set(GuildMember.user, user_info);
                        input += userInfoToCSV(user_info);
                        break;
                    }
                }
                if(!member_devo.has(GuildMember.user)){
                    let user_info = new UserInfo(id,GuildMember.user.username,0,true,0);
                    member_devo.set(GuildMember.user, user_info);
                    input += userInfoToCSV(user_info);
                }
            }
        }
        fs.writeFile('data.txt', input, (err) => {
            if (err) throw err;
            else{
               //console.log(input)
            }
         })
         
    }).catch(console.error);
    
});

// 0 - false
// 1 - true
// 2 - did devo but too short