const mkMessageNew = ({ SessionName, sharedstate }) => async (...args) => {
    console.log(`${SessionName} messageNew`)
  
  }
  
  module.exports = mkMessageNew