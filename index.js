const fs = require('fs-extra');
const {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
} = require('@adiwajshing/baileys');

async function connectToWhatsApp() {
  const conn = new WAConnection();
  //conn.loadAuthInfo('./auth_info.json'); // will load JSON credentials from file
  let attempts = 0;
  conn.connectOptions = {
    /** fails the connection if no data is received for X seconds */
    maxIdleTimeMs: 60000,
    /** maximum attempts to connect */
    maxRetries: 5,
    /** max time for the phone to respond to a connectivity test */
    phoneResponseTime: 15000,
    /** minimum time between new connections */
    connectCooldownMs: 40000,
    /** agent used for WS connections (could be a proxy agent) */
    agent: Agent = undefined,
    /** agent used for fetch requests -- uploading/downloading media */
    fetchAgent: Agent = undefined,
    /** always uses takeover for connecting */
    alwaysUseTakeover: true,
    /** log QR to terminal */
    logQR: false,
    //
    regenerateQRIntervalMs: 4000
  };
  //
  conn.autoReconnect = ReconnectMode.onConnectionLost; // only automatically reconnect when the connection breaks
  conn.logger.level = 'debug'; // set to 'debug' to see what kind of stuff you can implement
  // attempt to reconnect at most 10 times in a row
  //conn.connectOptions.maxRetries = 10;
  conn.chatOrderingKey = waChatKey(true); // order chats such that pinned chats are on top
  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of chats!
  conn.on('chats-received', async ({
    hasNewChats
  }) => {
    console.log(`you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`)
    const unread = await conn.loadAllUnreadMessages()
    console.log("you have " + unread.length + " unread messages")
  });
  //
  conn.on('chats-received', ({
    hasNewChats
  }) => {
    console.log(`you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`)
  });
  conn.on('contacts-received', () => {
    console.log(`you have ${Object.keys(conn.contacts).length} contacts`)
  });
  conn.on('initial-data-received', () => {
    console.log('received all initial messages')
  });
  //
  conn.on('qr', qr => {
    // Now, use the 'qr' string to display in QR UI or send somewhere
    attempts += 1;
    console.log({
      type: 'qr',
      qr,
      attempts
    });
  });
  //
  // this will be called as soon as the credentials are updated
  conn.on('open', () => {
    // save credentials whenever updated
    console.log(`credentials updated!`);
    const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
    // fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
    console.log(authInfo);
  });
  await conn.connect();
  //
  console.log('oh hello ' + conn.user.name + ' (' + conn.user.jid + ')')
  // uncomment to load all unread messages
  //const unread = await conn.loadAllUnreadMessages ()
  //console.log ('you have ' + unread.length + ' unread messages')
  conn.on('chat-update', async (chat) => {
    if (chat.presences) {
      return;
    }
    if (chat.imgUrl) {
      return;
    }
    if (!chat.hasNewMessage) {
      return;
    }

    const m = chat.messages.all()[0];
    console.log(m);
  });
  //
  conn.on('close', ({
    reason,
    isReconnecting
  }) => (
    console.log('oh no got disconnected: ' + reason + ', reconnecting: ' + isReconnecting)
  ));
}
// run in main file
connectToWhatsApp().catch(err => console.log("unexpected error: " + err)) // catch any errors