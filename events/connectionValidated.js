const mkConnectionValidated = ({ SessionName, sharedstate }) => async (...args) => {
    console.log(`${SessionName} connectionValidated`)
  
  }
  
  module.exports = mkConnectionValidated