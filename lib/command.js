const { exec } = require("child_process");
module.exports.setConnect = setConnect
module.exports.setDisonnect = setDisonnect
module.exports.listValidUser = listValidUser
module.exports.listAdminUser = listAdminUser
module.exports.listConnectUser = listConnectUser
module.exports.createUser = createUser
module.exports.checkConnect = checkConnect
var config = require('./config');

function setConnect (username) {
  const command = `
chmod -R a+w /tmp
chmod -R a+w ${config.socketDir}
su ${username} --command "code-server --auth none --socket ${config.getSockPath(username)} \\\${HOME} 2> \\\${HOME}/error.txt 1> \\\${HOME}/output.txt"
  `;
  const check = `
sleep 3
echo "error:"
su ${username} --command "cat \\\${HOME}/error.txt"
echo "stdout:"
su ${username} --command "cat \\\${HOME}/output.txt"
  `;
  exec(command, {shell: "/bin/bash"});
  exec(check,{shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error) {console.log(`error: ${error.message}`);return;}
    if (stderr) {console.log(`stderr: ${stderr}`);return;}
    console.log(stdout);
  });
}

function setDisonnect (username) {
  return `
rm -rf ${config.getSockPath(username)}
  `
}

function createUser(username,password,isAdmin) {
  const command = `
useradd -Nms /bin/bash ${username}
echo "${username}:${password}" | chpasswd
if [ ${isAdmin} = true ]
then
    echo "${username} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
    usermod -G sudo ${username}
fi
  `;
  exec(command, {shell: "/bin/bash"});
}

function initUser(username) {
  return `
code-server --install-extension ms-python.python
  `
}

function deleteUser(username) {
  return `
  `
}

function listValidUser (callback) {
  const command = `
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
  `;
  exec(command, {shell: "/bin/bash"}, (error, stdout, stderr) => {
    if (error) var err = error;
    if (stderr) var err = stderr;
    let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
    const validUser = text.split(",");
    callback(err,validUser);
  })
}

// https://askubuntu.com/questions/611584/how-could-i-list-all-super-users
function listAdminUser (callback) {
  const command = `
echo -n 'root,'
grep -Po '^sudo.+:\\K.*$' /etc/group
  `;
  exec(command, {shell: "/bin/bash"}, (error, stdout, stderr) => {
    if (error) var err = error;
    if (stderr) var err = stderr;
    let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
    const adminUser = text.split(",");
    callback(err,adminUser);
  })
}

function listConnectUser(callback) {
  const command =  `
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
  `;
  exec(command, {shell: "/bin/bash"}, (error, stdout, stderr) => {
    if (error) var err = error;
    if (stderr) var err = stderr;
    let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
    const connectUser = text.split(",");
    callback(err,connectUser);
  })
}

function checkConnect(username,callback) {
  const command = `
if  [ -S ${config.getSockPath(username)} ] ; then
  echo -n 'true'
fi
  `;
  exec(command, (error, stdout, stderr) => {
    if (error) var err = error;
    if (stderr) var err = stderr;
    let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
    const isConnect = text=="true";
    callback(err,isConnect);
  });
  
}