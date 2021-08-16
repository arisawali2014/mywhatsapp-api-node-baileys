const mkChatsReceived = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} chatsReceived`)

}

module.exports = mkChatsReceived