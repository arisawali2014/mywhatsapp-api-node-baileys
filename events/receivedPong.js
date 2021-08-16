const mkReceivedPong = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} receivedPong`)

}

module.exports = mkReceivedPong
