module.exports.setConnect = setConnect
module.exports.setAdmin = setAdmin
module.exports.unsetAdmin = unsetAdmin
module.exports.setDisconnect = setDisconnect
module.exports.setPassword = setPassword
module.exports.listValidUser = listValidUser
module.exports.listAdminUser = listAdminUser
module.exports.listConnectUser = listConnectUser
module.exports.createUser = createUser
module.exports.deleteUser = deleteUser
module.exports.checkConnect = checkConnect

const { exec } = require("child_process");
var config = require('./config');

function setConnect (username) {
  const command = `
chmod -R a+w /tmp
chmod -R a+w ${config.socketDir}
su ${username} --command "code-server --auth none --socket ${config.getSockPath(username)} \\\${HOME} 2> \\\${HOME}/error.txt 1> \\\${HOME}/output.txt"
  `;
  const check = `
sleep 3
chmod -R a-w ${config.socketDir}
echo "error:"
su ${username} --command "cat \\\${HOME}/error.txt"
echo "stdout:"
su ${username} --command "cat \\\${HOME}/output.txt"
  `;
  exec(command, {shell: "/bin/bash"});
  exec(check,{shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error) {console.log(`error: ${error.message}`);return;}
    if (stderr) {console.log(`stderr: ${stderr}`);return;}
    console.log("setConnect: username="+username);
    console.log(stdout);
  });
}

function setDisconnect (username) {
  return `
rm -rf ${config.getSockPath(username)}
  `
}

function setAdmin(username) {
  const command = `
echo "${username} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
usermod -G sudo ${username}
  `;
  exec(command, {shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error)  {console.log(`setAdmin error: ${error}`); return};
    if (stderr) {console.log(`setAdmin stderr: ${stderr}`); return}
    console.log("setAdmin: username="+username);
  });
}

function unsetAdmin(username) {
  const command = `
sudo deluser ${username} sudo
sed -i '/${username}\\ ALL=(ALL)/d' /etc/sudoers
  `;
  exec(command, {shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error)  {console.log(`unsetAdmin error: ${error}`); return};
    if (stderr) {console.log(`unsetAdmin stderr: ${stderr}`); return}
    console.log("unsetAdmin: username="+username);
  });
}

function setPassword(username,password) {
  const command = `
echo "${username}:${password}" | chpasswd
  `;
  exec(command, {shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error)  {console.log(`setPassword error: ${error}`); return};
    if (stderr) {console.log(`setPassword stderr: ${stderr}`); return}
    console.log("Create New User: username="+username+" setAdmin="+setAdmin);
  });
}

function createUser(username,password,setAdmin,setConnect) {
  const command = `
useradd -Nms /bin/bash ${username}
echo "${username}:${password}" | chpasswd
if [ ${setAdmin} = true ]
then
    echo "${username} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
    usermod -G sudo ${username}
fi
if [ ${setConnect} = true ]
then
    chmod -R a+w /tmp
    chmod -R a+w ${config.socketDir}
    su ${username} --command "code-server --auth none --socket ${config.getSockPath(username)} \\\${HOME} 2> \\\${HOME}/error.txt 1> \\\${HOME}/output.txt"
fi
  `;
  exec(command, {shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error)  {console.log(`createUser error: ${error}`); return};
    if (stderr) {console.log(`createUser stderr: ${stderr}`); return}
    console.log("Create New User: username="+username+" setAdmin="+setAdmin);
  });
}

function initUser(username) {
  return `
code-server --install-extension ms-python.python
  `
}

function deleteUser(username) {
  const command = `
userdel -rf ${username}
  `;
  exec(command, {shell: "/bin/bash"},(error, stdout, stderr) => {
    if (error)  {console.log(`deleteUser error: ${error}`); return};
    if (stderr) {console.log(`deleteUser stderr: ${stderr}`); return}
    console.log("Delete User: username="+username);
  });
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