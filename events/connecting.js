const mkConnecting = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} connecting`)

}

module.exports = mkConnecting
