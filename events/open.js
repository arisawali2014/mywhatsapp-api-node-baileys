const mkOpen = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} open`)

}

module.exports = mkOpen
