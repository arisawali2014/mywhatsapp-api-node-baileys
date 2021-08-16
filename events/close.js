const mkClose = ({ SessionName, sharedstate }) => async (...args) => {
  console.log(`${SessionName} close`)

}

module.exports = mkClose
