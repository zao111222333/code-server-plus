'use strict';
const { exec } = require("child_process");
var command = require('./lib/command');
var config = require('./lib/config');

exec(command.createUser('admin','123456',true),{shell: "/bin/bash"});
exec(command.createUser('test','123456',false),{shell: "/bin/bash"});
