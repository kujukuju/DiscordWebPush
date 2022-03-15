const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const express = require('express');
const https = require('https');

// console.log(process.argv);

const secure = process.argv[2] === 'secure';

const gcmKey = String(fs.readFileSync(path.join(__dirname, 'gcmkey.txt')));
const vapidKeyLines = String(fs.readFileSync(path.join(__dirname, 'vapidkeys.json'))).replaceAll('\r', '').split('\n');
let vapidPublicKey;
let vapidPrivateKey;

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

const app = express();
app.use(express.json());
app.get('/key.js', (req, res, next) => {
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
    endpoint = req.body.endpoint;
    key = req.body.key;
    auths = req.body.authSecret;
 
    res.sendStatus(201);
 });

 var endpoint = '';
 var key = '';
 var auths = '';

 const text = 'hello world';

 setInterval(() => {
    console.log('Endpoint: ', endpoint);
    if (endpoint !== '') {
        webpush.sendNotification({
            endpoint: endpoint,
            TTL: 60,
            keys: {
                auth: auths,
                p256dh: key,
            },
        }, text).then(() => {
            console.log('Push sent.');
        }).catch((error) => {
            console.log(error);
        });
    }
}, 1000);

if (secure) {
    const credentials = {
        key: String(fs.readFileSync(path.join(__dirname, 'selfsigned.key'))),
        cert: String(fs.readFileSync(path.join(__dirname, 'selfsigned.cert'))),
    };
    const server = https.createServer(credentials, app);
    server.listen(4002);
    console.log('Listening on port 4002.');
} else {
    app.listen(4002, () => {
        console.log('Listening on port 4002.');
    });
}
