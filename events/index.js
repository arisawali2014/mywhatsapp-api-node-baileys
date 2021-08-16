const mkOpen = require('./open')
const mkConnecting = require('./connecting')
const mkClose = require('./close')
const mkWsClose = require('./wsClose')
const mkQr = require('./qr')
const mkConnectionPhoneChange = require('./connectionPhoneChange')
const mkContactsReceived = require('./contactsReceived')
const mkChatsReceived = require('./chatsReceived')
const mkChatNew = require('./chatNew')
const mkChatUpdate = require('./chatUpdate')
const mkMessageStatusUpdate = require('./messageStatusUpdate')
const mkGroupParticipantsUpdate = require('./groupParticipantsUpdate')
const mkGroupUpdate = require('./groupUpdate')
const mkMessageNew = require('./messageNew')
const mkMessageUpdate = require('./messageUpdate')
const mkReceivedPong = require('./receivedPong')
const mkCredentialsUpdated = require('./credentialsUpdated')
const mkConnectionValidated = require('./connectionValidated')
const mkBlocklistUpdate = require('./blocklistUpdate')
const mkContactUpdate = require('./contactUpdate')
const mkUserPresenceUpdate = require('./userPresenceUpdate')
const mkUserStatusUpdate = require('./userStatusUpdate')

const mkEvents = ({
  SessionName,
  sharedstate
}) => ({
  blocklistUpdate: mkBlocklistUpdate({
    SessionName,
    sharedstate
  }),
  chatNew: mkChatNew({
    SessionName,
    sharedstate
  }),
  chatUpdate: mkChatUpdate({
    SessionName,
    sharedstate
  }),
  chatUpdate: mkChatUpdate({
    SessionName,
    sharedstate
  }),
  chatsReceived: mkChatsReceived({
    SessionName,
    sharedstate
  }),
  close: mkClose({
    SessionName,
    sharedstate
  }),
  connecting: mkConnecting({
    SessionName,
    sharedstate
  }),
  connectionPhoneChange: mkConnectionPhoneChange({
    SessionName,
    sharedstate
  }),
  connectionValidated: mkConnectionValidated({
    SessionName,
    sharedstate
  }),
  contactUpdate: mkContactUpdate({
    SessionName,
    sharedstate
  }),
  contactsReceived: mkContactsReceived({
    SessionName,
    sharedstate
  }),
  credentialsUpdated: mkCredentialsUpdated({
    SessionName,
    sharedstate
  }),
  groupParticipantsUpdate: mkGroupParticipantsUpdate({
    SessionName,
    sharedstate
  }),
  groupUpdate: mkGroupUpdate({
    SessionName,
    sharedstate
  }),
  messageNew: mkMessageNew({
    SessionName,
    sharedstate
  }),
  messageStatusUpdate: mkMessageStatusUpdate({
    SessionName,
    sharedstate
  }),
  messageUpdate: mkMessageUpdate({
    SessionName,
    sharedstate
  }),
  open: mkOpen({
    SessionName,
    sharedstate
  }),
  qr: mkQr({
    SessionName,
    sharedstate
  }),
  receivedPong: mkReceivedPong({
    SessionName,
    sharedstate
  }),
  wsClose: mkWsClose({
    SessionName,
    sharedstate
  }),
  userPresenceUpdate: mkUserPresenceUpdate({
    SessionName,
    sharedstate
  }),
  userStatusUpdate: mkUserStatusUpdate({
    SessionName,
    sharedstate
  })
})

module.exports = mkEvents