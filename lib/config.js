module.exports.getSockPath = getSockPath
module.exports.socketDir = socketDir

const path = require('path');

var port = 8000;
const bootConnectUser = false;
const bootConnectAdmin = true;
function socketDir(){return '/run'};
function hello(){return 'Welcom to Code Server Plus'};
function getSockPath (username) {
  return path.join(socketDir(), 'code-server@'+username+'.sock')
}
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}