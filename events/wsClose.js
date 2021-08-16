const mkWsClose = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} wsClose`)

}

module.exports = mkWsClose
