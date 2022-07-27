'use strict';
const { exec } = require("child_process");
var command = require('./lib/command');

const socketDir = '/run';
const bootConnectUser = false;

exec(command.setConnect('root',socketDir),{shell: "/bin/bash"});
exec(command.setConnect('admin',socketDir),{shell: "/bin/bash"});
exec(command.createUser('admin','123456',true),{shell: "/bin/bash"});
exec(command.createUser('test','123456',false),{shell: "/bin/bash"});
exec("sleep 5 && cat /root/error.txt && cat /root/output.txt",{shell: "/bin/bash"},(error, stdout, stderr) => {
  if (error) {console.log(`error: ${error.message}`);return;}
  if (stderr) {console.log(`stderr: ${stderr}`);return;}
  console.log(stdout);
});