const path = require('path');

const port = 8000;
const bootConnectUser = false;
const bootConnectAdmin = true;
const socketDir = '/run';

function hello(){return 'Welcom to Code Server Plus'};
function getSockPath (username) {
  return path.join(socketDir, 'code-server@'+username+'.sock')
}
function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

function checkDependencies (){
  // code-server
  // pam
  // 
}

module.exports.getSockPath = getSockPath
module.exports.socketDir = socketDir
module.exports.port = port