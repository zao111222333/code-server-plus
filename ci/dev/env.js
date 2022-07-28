'use strict';
var command = require('../../lib/command');

command.createUser('admin','123456',true);
command.createUser('test','123456',false);
