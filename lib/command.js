module.exports.setConnect = setConnect
module.exports.setDisonnect = setDisonnect
module.exports.listValidUser = listValidUser
module.exports.listAdminUser = listAdminUser
module.exports.listConnectUser = listConnectUser
module.exports.createUser = createUser
module.exports.checkConnect = checkConnect

var config = require('./config');

function setConnect (username) {
  return `
chmod -R a+w /tmp
chmod -R a+w ${config.socketDir()}
su ${username} --command "code-server --auth none --socket ${config.getSockPath(username)} \\\${HOME} 2> \\\${HOME}/error.txt 1> \\\${HOME}/output.txt"
  `
}

function setDisonnect (username) {
  return `
rm -rf ${config.getSockPath(username)}
  `
}

function listValidUser () {
  return `
users=""
while read line; do
  user=\${line%%:*}
  if id "$user" >/dev/null 2>&1; then
    shell="$(getent passwd "$user" | cut -d: -f7)"
    if [ -n "$shell" ] && grep -qwF "$shell" /etc/shells; then
      users=\${users}","$user
    fi
  fi
done </etc/passwd
echo "\${users:1}"
  `
}

// https://askubuntu.com/questions/611584/how-could-i-list-all-super-users
function listAdminUser () {
  return `
echo -n 'root,'
grep -Po '^sudo.+:\\K.*$' /etc/group
  `
}

function listConnectUser() {
  return `
users=""
SOCK_DIR=/var/run
for file in \${SOCK_DIR}/*.sock; do
  if  [ -S $file ] ; then
    tmp=\${file#*@}
    user=\${tmp%.*}
    users=\${users}","$user
  fi
done
echo "\${users:1}"
  `
}

function createUser(username,password,isAdmin) {
  return `
useradd -Nms /bin/bash ${username}
echo "${username}:${password}" | chpasswd
if [ ${isAdmin} = true ]
then
    echo "${username} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
    usermod -G sudo ${username}
fi
  
  `
}

function checkConnect(username) {
  return `
if  [ -S ${config.getSockPath(username)} ] ; then
    echo true
fi
  `
}