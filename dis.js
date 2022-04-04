const Discord = require("discord.js");
require("dotenv").config();

const prefix = process.env.PREFIX;
const token = process.env.TOKEN;

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGE_REACTIONS",
    ],
});

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});


client.login(token);