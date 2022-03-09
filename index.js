const Discord = require("discord.js");
const DisTube = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
require('dotenv').config();

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

const distube = new DisTube.default(client, {
    youtubeDL: false,
    plugins: [new YtDlpPlugin()],
    leaveOnEmpty: true,
    leaveOnFinish: false,
    leaveOnStop: false
});

client.once("ready", () => {
    console.log("Logged in!");
});

client.on("messageCreate", function (message) {
    if (startupValidations(message)) return;
    const command = textToCommand(message);
    if (command == 'ping') ping(message);
    distubePlayingSongs(command, message);
});

distubeEventListener(distube);

function distubePlayingSongs(command, message) {
    if (command == "play") playSong(message);
    if (["repeat", "loop"].includes(command)) repeatLoop(command);
    if (command === "stop") {
        distube.stop(message);
        message.channel.send("Stopped the music!");
    }
    if (command === "leave") {
        distube.voices.get(message)?.leave();
        message.channel.send("Leaved the voice channel!");
    }
    if (command === "resume") distube.resume(message);
    if (command === "pause") distube.pause(message);
    if (["next", "skip"].includes(command)) distube.skip(message);

    if (
        [
            "3d",
            "bassboost",
            "echo",
            "karaoke",
            "nightcore",
            "vaporwave",
        ].includes(command)
    ) {
        const filter = distube.setFilter(message, command);
        message.channel.send(
            `Current queue filter: ${filter.join(", ") || "Off"}`
        );
    }
}

function repeatLoop(message){
    const mode = distube.setRepeatMode(message);
        message.channel.send(
            `Set repeat mode to \`${
                mode ? (mode === 2 ? "All Queue" : "This Song") : "Off"
            }\``
        );
}

function playSong(message) {
    const voiceChannel = message.member?.voice?.channel;
    var args = message.content.slice(prefix.length).trim().split(" ");
    var mainArgs = args.join(" ");

    if (validURL(args[1])) {
        mainArgs = "play " + youtubeLinkToParam(args[1]);
    }
    
    if (voiceChannel) {
        distube.play(voiceChannel, mainArgs, {
            message,
            textChannel: message.channel,
            member: message.member,
        });
    } else {
        message.channel
            .send("You must join a voice channel first.")
            .then(function (message) {
                message.react("😒");
            })
            .catch(function () {});
    }
}

function ping(message) {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pongs! This message had a latency of ${timeTaken}ms.`);
}

function startupValidations(message) {
    if (message.author.bot) return true;
    if (!message.content.startsWith(prefix)) return true;
}

function textToCommand(message) {
    commandBody = message.content.slice(prefix.length);
    args = commandBody.split(" ");
    command = args.shift().toLowerCase();
    return command;
}

function distubeEventListener(distube) {
    const status = (queue) =>
        `Volume: \`${queue.volume}%\` | Filter: \`${
            queue.filters.join(", ") || "Off"
        }\` | Loop: \`${
            queue.repeatMode
                ? queue.repeatMode === 2
                    ? "All Queue"
                    : "This Song"
                : "Off"
        }\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;
    // DisTube event listeners, more in the documentation page
    distube
        .on("playSong", (queue, song) => {
            queue.textChannel?.send(
                `Playing \`${song.name}\` - \`${
                    song.formattedDuration
                }\`\nRequested by: ${song.user}\n${status(queue)}`
            );
        }
            
        )
        .on("addSong", (queue, song) =>
            queue.textChannel?.send(
                `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
            )
        )
        .on("addList", (queue, playlist) =>
            queue.textChannel?.send(
                `Added \`${playlist.name}\` playlist (${
                    playlist.songs.length
                } songs) to queue\n${status(queue)}`
            )
        )
        .on("error", (textChannel, e) => {
            console.error(e);
            textChannel.send(
                `An error encountered: ${e.message.slice(0, 2000)}`
            );
        })
        .on("finish", (queue) => queue.textChannel?.send("Finish queue!"))
        .on("finishSong", (queue) => queue.textChannel?.send("Finish song!"))
        .on("disconnect", (queue) => queue.textChannel?.send("Disconnected!"))
        .on("empty", (queue) =>
            queue.textChannel?.send(
                "The voice channel is empty! Leaving the voice channel..."
            )
        )
        .on("initQueue", queue => {
            queue.autoplay = false;
            queue.volume = 100;
        })
        // DisTubeOptions.searchSongs > 1
        .on("searchResult", (message, result) => {
            let i = 0;
            message.channel.send(
                `**Choose an option from below**\n${result
                    .map(
                        (song) =>
                            `**${++i}**. ${song.name} - \`${
                                song.formattedDuration
                            }\``
                    )
                    .join(
                        "\n"
                    )}\n*Enter anything else or wait 30 seconds to cancel*`
            );
        })
        .on("searchCancel", (message) =>
            message.channel.send("Searching canceled")
        )
        .on("searchInvalidAnswer", (message) =>
            message.channel.send("Invalid number of result.")
        )
        .on("searchNoResult", (message) =>
            message.channel.send("No result found!")
        )
        .on("searchDone", () => {});
}

function validURL(str) {
    var pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
        "i"
    );
    return !!pattern.test(str);
}

function youtubeLinkToParam(urlText) {
    var url_string = urlText;
    var url = new URL(url_string);
    return url.searchParams.get("v");
}

client.login(token);
