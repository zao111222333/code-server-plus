const path = require('path');
var crypto = require("crypto");

const port = 8080;
const socketDir = '/run';
const bootConnectUser = false;
const bootConnectAdmin = true;
const sessionName = "code-server-plus-session";
const sessionSecret = crypto.randomBytes(20).toString('hex');

function getSockPath (username) {
  return path.join(socketDir, 'code-server@'+username+'.sock')
}
function hello(){return 'Welcom to Code Server Plus'};
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

module.exports.getSockPath = getSockPath
module.exports.socketDir = socketDir
module.exports.port = port
module.exports.bootConnectAdmin = bootConnectAdmin
module.exports.bootConnectUser = bootConnectUser
module.exports.sessionName = sessionName
module.exports.sessionSecret = sessionSecret