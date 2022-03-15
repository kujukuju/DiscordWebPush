const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const express = require('express');
const https = require('https');

const INACTIVE_TIMEOUT = 1 * 60 * 1000;
const JOHN = 'GeneralJelly#9827';

// console.log(process.argv);

const secure = process.argv[2] === 'secure';

const discordkey = String(fs.readFileSync(path.join(__dirname, 'discordkey.txt')));
const gcmKey = String(fs.readFileSync(path.join(__dirname, 'gcmkey.txt')));
const vapidKeyLines = String(fs.readFileSync(path.join(__dirname, 'vapidkeys.json'))).replaceAll('\r', '').split('\n');
let vapidPublicKey;
let vapidPrivateKey;

// this will be used to keep track of username -> notification information, but for now its just for john
// we will do this by creating user.js redirect, passing in their username and a secret, storing that username and secret in the associations file, then
// when they submit their notification request with their username and secret we validate the secret and create the association
const associationPath = path.join(__dirname, "associations.json");

let associations = {};
if (fs.existsSync(associationPath)) {
    associations = JSON.parse(String(fs.readFileSync(associationPath)));
}
associations.lastActiveTime = 0;

let nextIsPublic = false;
let nextIsPrivate = false;
for (let i = 0; i < vapidKeyLines.length; i++) {
    if (vapidKeyLines[i].toLowerCase().includes('public key')) {
        nextIsPublic = true;
    } else if (vapidKeyLines[i].toLowerCase().includes('private key')) {
        nextIsPrivate = true;
    } else {
        if (nextIsPublic) {
            vapidPublicKey = vapidKeyLines[i];
        } else if (nextIsPrivate) {
            vapidPrivateKey = vapidKeyLines[i];
        }

        nextIsPublic = false;
        nextIsPrivate = false;
    }
}

const discordClient = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

discordClient.on('ready', () => {
    console.log('Logged in as ' + discordClient.user.tag + '.');
});

discordClient.on('messageCreate', message => {
    const guildID = message.guildId;
    const channelID = message.channelId;

    const guild = discordClient.guilds.resolve(guildID);
    if (!guild) {
        return;
    }

    const channel = guild.channels.resolve(channelID);
    if (!channel) {
        return;
    }

    if (message.author.username + '#' + message.author.discriminator === JOHN) {
        associations.lastActiveTime = Date.now();
    }

    if (message.mentions.everyone) {
        notify(channel, message.author.username, message.content, message.url);
    } else {
        const mentioned = [];
        message.mentions.users.forEach(user => {
            mentioned.push(user.username + '#' + user.discriminator);
        });

        if (mentioned.includes(JOHN)) {
            notify(channel, message.author.username, message.content, message.url);
        }
    }
});

discordClient.login(discordkey);

const app = express();
app.use(express.json());
// app.get('/user.js', (req, res, next) => {
//     res.setHeader('content-type', 'text/javascript');
//     res.send('const USERNAME = \'' + vapidPublicKey + '\';');
// });
app.get('/key.js', (req, res, next) => {
    res.setHeader('content-type', 'text/javascript');
    res.send('const PUBLIC_KEY = \'' + vapidPublicKey + '\';');
});
app.use(express.static(path.join(__dirname, 'public')));

webpush.setGCMAPIKey(gcmKey);
webpush.setVapidDetails(
    'mailto:kuju@veraegames.com',
    vapidPublicKey,
    vapidPrivateKey,
);

app.post('/register', (req, res) => {
    console.log('Registered: ', req);
    associations.endpoint = req.body.endpoint;
    associations.key = req.body.key;
    associations.auths = req.body.authSecret;
    associations.lastActiveTime = 0;

    writeAssociations();
 
    res.sendStatus(201);
 });

const notify = (channel, author, text, link) => {
    if (!associations.endpoint) {
        channel.send('You must connect your notifications.');
        return;
    }

    if (Date.now() - associations.lastActiveTime < INACTIVE_TIMEOUT) {
        return;
    }

    webpush.sendNotification({
        endpoint: associations.endpoint,
        TTL: 60,
        keys: {
            auth: associations.auths,
            p256dh: associations.key,
        },
    }, author + ': ' + text + ' ' + link).then(() => {
        console.log('Push sent.');
    }).catch((error) => {
        console.log(error);
    });
};

if (secure) {
    const credentials = {
        key: String(fs.readFileSync(path.join(__dirname, 'selfsigned.key'))),
        cert: String(fs.readFileSync(path.join(__dirname, 'selfsigned.cert'))),
    };
    const server = https.createServer(credentials, app);
    server.listen(4002);
    console.log('Listening on port 4002.');
} else {
    app.listen(4000, () => {
        console.log('Listening on port 4000.');
    });
}

const writeAssociations = () => {
    fs.writeFileSync(associationPath, JSON.stringify(associations));
};
