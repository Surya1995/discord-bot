const Discord = require("discord.js");
require("dotenv").config();
const {
    Player,
    RepeatMode,
    ProgressBar,
    Queue,
} = require("discord-music-player");

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

const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
    deafenOnJoin: true,
    leaveOnEnd: false,
    leaveOnStop: false,
});
// You can define the Player as *client.player* to easily access it.
client.player = player;

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});

client.on("messageCreate", async (message) => {
    if (startupValidations(message)) return;
    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift();
    let guildQueue = client.player.getQueue(message.guild.id);
    const voiceChannel = message.member?.voice?.channel;
    if (voiceChannel) {
        if (command === "play") {
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue
                .play(args.join(" "), { data: { initMessage: message } })
                .catch((_) => {
                    if (!guildQueue) queue.stop();
                });
        }

        if (command === "playlist") {
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue
                .playlist(args.join(" "), { data: { initMessage: message } })
                .catch((_) => {
                    if (!guildQueue) queue.stop();
                });
        }
    } else {
        message.channel
            .send(
                "You must join a voice channel first. | पहले चैनल ज्वाइन कर नसेड़ी"
            )
            .then(function (message) {
                message.react("😒");
            })
            .catch(function () {});
    }

    if (command === "skip") {
        guildQueue.skip();
    }

    if (command === "stop") {
        guildQueue.stop();
    }

    if (command === "removeLoop") {
        guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
    }

    if (command === "toggleLoop") {
        guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
    }

    if (command === "toggleQueueLoop") {
        guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
    }

    if (command === "setVolume") {
        guildQueue.setVolume(parseInt(args[0]));
    }

    if (command === "seek") {
        guildQueue.seek(parseInt(args[0]) * 1000);
    }

    if (command === "clearQueue") {
        guildQueue.clearQueue();
    }

    if (command === "shuffle") {
        guildQueue.shuffle();
    }

    if (command === "getQueue") {
        console.log(guildQueue);
    }

    if (command === "getVolume") {
        console.log(guildQueue.volume);
    }

    if (command === "nowPlaying") {
        console.log(`Now playing: ${guildQueue.nowPlaying}`);
    }

    if (command === "pause") {
        guildQueue.setPaused(true);
    }

    if (command === "resume") {
        guildQueue.setPaused(false);
    }

    if (command === "remove") {
        guildQueue.remove(parseInt(args[0]));
    }

    if (command == "ping") ping(message);

    if (command === "createProgressBar") {
        const ProgressBar = guildQueue.createProgressBar();

        // [======>              ][00:35/2:20]
        //console.log(message);
        message.reply(ProgressBar.prettier);
        //console.log(ProgressBar.prettier);
    }
});

function ping(message) {
    const timeTaken = Date.now() - message.createdTimestamp;
    message
        .reply(`Pongs! This message had a latency of ${timeTaken}ms.`)
        .then(function (message) {
            message.react("👍");
            message.react("👎");
        })
        .catch(function () {});;
}

function startupValidations(message) {
    if (message.author.bot) return true;
    if (!message.content.startsWith(prefix)) return true;
}
function sendMessage(guildId, message) {
    let getQueue = client.player.getQueue(guildId);
    let { initMessage } = getQueue.nowPlaying.data;
    initMessage.channel.send(message)
}
playerEvents(client);
function playerEvents(client) {
    
    // Init the event listener only once (at the top of your code)
    client.player
        // Emitted when channel was empty.
        .on("channelEmpty", (queue) =>
            console.log(`Everyone left the Voice Channel, queue ended.`)
        )
        // Emitted when a song was added to the queue.
        .on(
            "songAdd",
            (queue, song) => {
                //console.log(queue);
                //let getQueue = player.getQueue(queue.guild.id);   
                sendMessage(
                    queue.guild.id,
                    `Playing \`${song.name}\` - \`${song.duration}\`\nRequested by: ${song.data.initMessage.author}`
                );
            }
        )
        // Emitted when a playlist was added to the queue.
        .on("playlistAdd", (queue, playlist) =>
            console.log(
                `Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`
            )
        )
        // Emitted when there was no more music to play.
        .on("queueDestroyed", (queue) =>
            console.log(`The queue was destroyed.`)
        )
        // Emitted when the queue was destroyed (either by ending or stopping).
        .on("queueEnd", (queue) => console.log(`The queue has ended.`))
        // Emitted when a song changed.
        .on("songChanged", (queue, newSong, oldSong) =>
            console.log(`${newSong} is now playing.`)
        )
        // Emitted when a first song in the queue started playing.
        .on("songFirst", (queue, song) =>
            console.log(`Started playing ${song}.`)
        )
        // Emitted when someone disconnected the bot from the channel.
        .on("clientDisconnect", (queue) =>
            console.log(`I was kicked from the Voice Channel, queue ended.`)
        )
        // Emitted when deafenOnJoin is true and the bot was undeafened
        .on("clientUndeafen", (queue) => console.log(`I got undefeanded.`))
        // Emitted when there was an error in runtime
        .on("error", (error, queue) => {
            console.log(`Error: ${error} in ${queue.guild.name}`);
        });
}

client.login(token);