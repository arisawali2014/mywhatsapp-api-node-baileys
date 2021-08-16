const Sessions = require("../sessions.js");
const mkQr = ({
  SessionName,
  sharedstate
}) => async (...args) => {
  console.log(`${SessionName} qr`)

}

module.exports = mkQr