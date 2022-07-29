'use strict';
var url = require('url') ;
var http = require('http');
var httpProxy = require('http-proxy');
const modifyResponse = require('http-proxy-response-rewrite')
var express = require('express');
var session = require("express-session");
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var pam = require('authenticate-pam');
const fs = require("fs");
const path = require('path');
var command = require('./lib/command');
var config = require('./lib/config');
var sessions = require('./lib/sessions');
var msg = require('./lib/msg');
var html = require('./lib/html');

// setup: 
// check isRoot
// parser config
// check dependencies
// connect default user
const isRoot = process.getuid && process.getuid() === 0;;
if (!isRoot){
  console.error('Error: Need bo be root');
  process.exit(1);
}
command.listAdminUser((err, adminUser) => {
  if (err) {console.log(err);return}
  command.listValidUser((err, validUser) => {
    if (err) {console.log(err);return}
    command.listConnectUser((err, connectUser) => {
      if (err) {console.log(err);return}
      validUser.forEach((user, i) => {
        if (!connectUser.includes(user)) {
          if (adminUser.includes(user)) {
            if (config.bootConnectAdmin) command.setConnect(user);
          } else {
            if (config.bootConnectUser) command.setConnect(user);
          }
        }
      });
    });
  });
});




var proxy = httpProxy.createProxyServer({ ws: true });

var app = express();
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: config.sessionName,
  rolling: true,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: 30 * 60 * 1000 
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/code-server-plus/views',express.static('./static/views'));
app.use('/code-server-plus/js',express.static('./static/js'));
app.use(sessions);


// Listen for the `proxyRes` event on `proxy`.
proxy.on('proxyRes', function (proxyRes, req, res) {
  modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
      var pathname = url.parse(req.url).pathname;
      if (pathname=='/' && body) {
        let username='';
        let isAdmin=false;
        if (app.sessions){
          let cookieHeader = req.headers?.cookie;
          if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), config.sessionSecret)
          if (cookies) var requestSessionID=cookies[config.sessionName];
          if (requestSessionID) var session=app.sessions[requestSessionID];
          if (session) {
            username=session['loginUsername'];
            isAdmin=session['isAdmin'];
          };
        }
        const style = '<link rel="stylesheet" type="text/css" href="/code-server-plus/views/style/menubar.css">';
        var body = body.replace('<body aria-label="">', '<body aria-label="">'+html.genMenuBar(username,isAdmin));
        var body = body.replace('</head>', style+'</head>');
      }
      return body;
  });
});

app.get('/login', function(req, res) {
  const limit = req.session.attempt >= 5;
  const msg = req.session.msg ? req.session.msg : '';
  const msgType = req.session.msgType ? req.session.msgType : '';
  const attempt = req.session.attempt ? req.session.attempt : '';
  const username = (req.session.loginUsername && req.session.login) ? req.session.loginUsername : (
                   (req.session.handleUsername && !req.session.login)? req.session.handleUsername :'');
  const js = `<script src="/code-server-plus/js/login.js" limit="${limit}" msg="${msg}" msgType="${msgType}" attempt="${attempt}" username="${username}" type="text/javascript"></script>`;
  fs.readFile('./static/views/login.html', 'utf8', function (err,data) {
    if (err) {console.log(err);return}
    data = data.replace('<!-- include the js file -->', js);
    res.send(data);
  });
});

app.post('/login', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
	let toAdmin = req.body.toAdmin;
	if (username && password) {
    command.listValidUser((err, validUser) => {
      if (err) {console.log(err);return}
      if (!validUser.includes(username)) {
        msg('Invalid Username','login-error',username,req,res);
      } else {
        pam.authenticate(username, password, function(err) {
          if (err) {
            msg('Incorrect Password','login-error',username,req,res);
          }else {
            command.listAdminUser((err, adminUser) => {
              if (err) {console.log(err);return}
              console.log("Login: username="+username);
              req.session.isAdmin = adminUser.includes(username);
              req.session.login = true;
              req.session.msg = 'login';
              req.session.msgType = 'login';
              req.session.loginUsername = username;
              req.session.handleUsername = '';
              req.session.attempt=0;
              if (toAdmin) {
                res.redirect('/admin');
              } else {
                res.redirect('/');
              }
            });            
          }
        });
      }
    });
  }
});


// logout
app.get("/logout", function (req, res) {
  if (req.session.login) {
    res.sendFile(path.join(__dirname + '/static/views/logout.html'));
  } else {
    fs.readFile('./static/views/return.html', 'utf8', function (err,data) {
      if (err) {console.log(err);return}
      data = data.replace('msg = \'\'', 'msg = \'You have NOT Login!\'');
      res.send(data);
    });
  }
});
app.post('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/login');
});

// admin
app.get('/admin', function(req, res) {
  if (req.session.login && req.session.isAdmin) {
    command.listAdminUser((err, adminUser) => {
      if (err) {console.log(err);return}
      command.listValidUser((err, validUser) => {
        if (err) {console.log(err);return}
        command.listConnectUser((err, connectUser) => {
          if (err) {console.log(err);return}
          let users = [];
          let admins = [];
          validUser.forEach((user, i) => {
            if (adminUser.includes(user)) {
              admins.push(user);
            } else {
              users.push(user);
            }
          });
          users.sort();
          admins.sort();
          const msg = req.session.msg ? req.session.msg : '';
          const msgType = req.session.msgType ? req.session.msgType : '';
          const username = req.session.handleUsername ? req.session.handleUsername : '';
          const hasSetAdmin = req.session.hasSetAdmin ? req.session.hasSetAdmin : '';
          const js = `<script src="/code-server-plus/js/admin.js" msg="${msg}" msgType="${msgType}" username="${username}" hasSetAdmin="${hasSetAdmin}" type="text/javascript"></script>`;
          const userInfoHtml = html.genUserCard(req.session.loginUsername,users,admins,connectUser);
          fs.readFile('./static/views/admin.html', 'utf8', function (err,data) {
            if (err) {console.log(err);return}
            data = data.replace('<!-- User Info -->', userInfoHtml);
            data = data.replace('<!-- include the js file -->', js);
            res.send(data);
          });
        });
      });
    });
  } else {
    fs.readFile('./static/views/return.html', 'utf8', function (err,data) {
      if (err) {console.log(err);return}
      data = data.replace('msg = \'\'', 'msg = \'You are NOT Admin!\'');
      res.send(data);
    });
  }
});

app.get('/*', function(req, res) {
  if (req.session.login) {
    const username = req.session.loginUsername;
    command.checkConnect(username,(err, isConnect) => {
      if (err) {console.log(err);return}
      if (isConnect) {
        proxy.web(req, res, {
          target: {
            socketPath: config.getSockPath(username)
          }
        });
      } else {
        if (req.session.isAdmin) {
          console.log("ERROR: Can NOT find UNIX socket file: "+ config.getSockPath(username));
          res.redirect('/admin');
        } else {
          console.log("ERROR: Can NOT find UNIX socket file: "+ config.getSockPath(username));
          msg('You are Disconnect','login-error',username,req,res);
        }
      }
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/admin/create', function(req, res) {
  if (req.session.isAdmin) {
      req.session.hasSetAdmin = false;
      let username = req.body.username;
      let password = req.body.password;
      let passwordCheck = req.body.passwordCheck;
      let setAdmin = req.body.setAdmin? true:false;
      let setConnect = req.body.setConnect ? true:false;
      if (!(passwordCheck==password)) {
        msg("Passwords Do NOT Match","create-user-error",username,req,res);
        return;
      };
      command.listValidUser((err, validUser) => {
        if (err) {console.log(err);return}
        if (validUser.includes(username)) {
          msg("User Already Exist","create-user-error",username,req,res);
        } else {
          command.createUser(username,password,setAdmin);
          if (setConnect) {
            command.setConnect(username)
          };
          req.session.hasSetAdmin=setAdmin;
          req.session.handleUsername=username;
          req.session.msg='Success';
          req.session.msgType='create user success';
          res.redirect('/admin#create');
        }
      });
    } else {
      res.redirect('/');
    }
});

app.post('/admin/manage', function(req, res) {
  if (req.session.isAdmin) {
    let changeusername = req.body.changeusername;
    let changetype = req.body.changetype;
    let changevalue = req.body.changevalue;
    let password = req.body.password;
    let passwordCheck = req.body.passwordCheck;
    let command = '';
    console.log(changetype);
    console.log(changevalue);
    switch (changetype) {
      case 'setAdmin':
        if (changevalue=='toUser') {
          command = 'toUser '+changeusername;
        }
        if (changevalue=='toAdmin') {
          command = 'toAdmin '+changeusername;
        }
        break;
      case 'setConnect':
        if (changevalue=='toDisconnect') {
          command = 'toDisconnect '+changeusername;
        }
        if (changevalue=='toConnect') {
          command = 'toConnect '+changeusername;
        }
        break;
      case 'setPassword':
        if (!(password==passwordCheck)) {
          createErr("Passwords Do NOT Match",changeusername,req,res);
          return;
        };
        command = 'setPassword '+changeusername+" "+passwordCheck;
        break;
      case 'setDelete':
          command = 'setDelete '+changeusername;
          break;
      default:
        console.log('None');
      }
      console.log(command);
      res.redirect('/admin#confirm_table');
  } else {
    res.redirect('/');
  }
});


var server = http.createServer(app);
// Proxy websockets
server.on('upgrade', function (req, socket, head) {
  if (app.sessions){
    let cookieHeader = req.headers?.cookie;
    if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), config.sessionSecret)
    if (cookies) var requestSessionID=cookies[config.sessionName];
    if (requestSessionID) var session=app.sessions[requestSessionID];
    if (session) var loginUsername=session['loginUsername'];
    if (loginUsername) {
      command.checkConnect(loginUsername,(err, isConnect) => {
        if (err) {console.log(err);return}
        if (isConnect) {
          proxy.ws(req, socket, head,{target: {
            socketPath: config.getSockPath(loginUsername)
          }});
        } else {
          console.log("ERROR: Can NOT find UNIX socket file: "+ socketPath);
        }
      });
    }
  }
});

server.listen(config.port);