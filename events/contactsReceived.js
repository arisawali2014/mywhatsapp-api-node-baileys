const mkContactsReceived = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} contactsReceived`)

}

module.exports = mkContactsReceived
