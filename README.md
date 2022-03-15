Create `discordkey.txt` in the root folder of the project.
Put your discord secret key in there.

Run `yarn keygen` to generate your vapid keys.

Generate gcm api key.
https://console.cloud.google.com/
Save it in `gcmkey.txt` file.

---

Go create a discord bot and copy the client ID.

Navigate to https://discord.com/api/oauth2/authorize?client_id=[CLIENT_ID]&permissions=68608&scope=bot and add your bot to your server. Be sure to swap out your `[CLIENT_ID]`.
