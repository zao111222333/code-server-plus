module.exports.getSockPath = getSockPath

const path = require('path');

const socketDir = '/run';
const bootConnectUser = false;
const bootConnectAdmin = true;

function getSockPath (username) {
  return path.join(socketDir, 'code-server@'+username+'.sock')
}