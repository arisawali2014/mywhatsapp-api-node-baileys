const fs = require('fs')

const mkCredentialsUpdated = ({ SessionName, sharedstate }) => async (...args) => {
    console.log(`${SessionName} credentialsUpdated`)

    const WAC = sharedstate.WAC
    fs.writeFileSync(`auth_info/${SessionName}.json`, JSON.stringify(WAC.base64EncodedAuthInfo(), null, 2))
  
  }
  
  module.exports = mkCredentialsUpdated