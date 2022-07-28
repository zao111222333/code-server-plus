'use strict';
var url = require('url') ;
var http = require('http');
var httpProxy = require('http-proxy');
const modifyResponse = require('http-proxy-response-rewrite')
var express = require('express');
var session = require("express-session");
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var crypto = require("crypto");
var pam = require('authenticate-pam');
const fs = require("fs");
const path = require('path');
const { exec } = require("child_process");
var command = require('./lib/command');
var config = require('./lib/config');
var sessions = require('./lib/sessions.js');
var msgResponse = require('./lib/msgResponse');
var html = require('./lib/html');


exec(command.setConnect('root'),{shell: "/bin/bash"});
exec(command.setConnect('admin'),{shell: "/bin/bash"});
exec("sleep 5 && cat /home/admin/error.txt && cat /home/admin/output.txt",{shell: "/bin/bash"},(error, stdout, stderr) => {
  if (error) {console.log(`error: ${error.message}`);return;}
  if (stderr) {console.log(`stderr: ${stderr}`);return;}
  console.log(stdout);
});

const sessionName = "code-server-plus-session";
const sessionSecret = crypto.randomBytes(20).toString('hex');

const isRoot = process.getuid && process.getuid() === 0;;
if (!isRoot){
  console.error('Error: Need bo be root')
  // process.exi
}

var proxy = httpProxy.createProxyServer({ ws: true });

var app = express();
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: sessionName,
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
app.use('/code-server-plus/views',express.static('./views'));
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
          if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), sessionSecret)
          if (cookies) var requestSessionID=cookies[sessionName];
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
  fs.readFile('./views/login.html', 'utf8', function (err,data) {
    if (err) {console.log(err);return}
    var data = data.replace('limit = false', 'limit = '+limit);
    if (req.session.msg) data = data.replace('msg = \'\'', 'msg = \''+req.session.msg+'\'');
    if (req.session.msgType) data = data.replace('msgType = \'\'', 'msgType = \''+req.session.msgType+'\'');
    if (req.session.attempt) data = data.replace('attempt = \'\'', 'attempt = \''+req.session.attempt+'\'');
    if (req.session.loginUsername && req.session.login) {
      data = data.replace('username = \'\'', 'username = \''+req.session.loginUsername+'\'');
    } else if(req.session.handleUsername && !req.session.login){
      data = data.replace('username = \'\'', 'username = \''+req.session.handleUsername+'\'');
    }
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
      console.log('validUser: '+validUser);
      if (!validUser.includes(username)) {
        msgResponse('Invalid Username','login-error','',username,req,res);
      } else {
        pam.authenticate(username, password, function(err) {
          if (err) {
            msgResponse('Incorrect Password','login-error','',username,req,res);
          }else {
            command.listAdminUser((err, adminUser) => {
              if (err) {console.log(err);return}
              req.session.isAdmin = adminUser.includes(username);
              console.log('adminUser: '+adminUser);
              console.log("Login: username="+username);
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
    res.sendFile(path.join(__dirname + '/views/logout.html'));
  } else {
    // res.sendFile(path.join(__dirname + '/views/return.html'));
    fs.readFile('./views/return.html', 'utf8', function (err,data) {
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
          fs.readFile('./views/admin.html', 'utf8', function (err,data) {
            if (err) {console.log(err);return}
            if (req.session.msg) data = data.replace('msg = \'\'', 'msg = \''+req.session.msg+'\'');
            if (req.session.msgType) data = data.replace('msgType = \'\'', 'msgType = \''+req.session.msgType+'\'');
            if (req.session.loginUsername) data = data.replace('loginUsername = \'\'', 'loginUsername = \''+req.session.loginUsername+'\'');
            if (req.session.handleUsername) data = data.replace('handleUsername = \'\'', 'handleUsername = \''+req.session.handleUsername+'\'');
            data = data.replace('<!-- User Info -->', html.genUserCard(req.session.loginUsername,users,admins,connectUser));
            res.send(data);
          });
        });
      });
    });
  } else {
    // res.sendFile(path.join(__dirname + '/views/return.html'));
    fs.readFile('./views/return.html', 'utf8', function (err,data) {
      if (err) {console.log(err);return}
      data = data.replace('msg = \'\'', 'msg = \'You are NOT Admin!\'');
      res.send(data);
    });
  }
});

app.get('/*', function(req, res) {
  if (req.session.login) {
    exec(command.checkConnect(req.session.loginUsername), (error, stdout, stderr) => {
      if (error) {console.log(`error: ${error.message}`);return;}
      if (stderr) {console.log(`error: ${stderr}`);return;}
      let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
      if (text=="true") {
        proxy.web(req, res, {
          target: {
            socketPath: config.getSockPath(req.session.loginUsername)
          }
        });
      } else {
        if (req.session.isAdmin) {
          console.log("ERROR: Can NOT find UNIX socket file: "+ config.getSockPath(req.session.loginUsername));
          res.redirect('/admin');
        } else {
          console.log("ERROR: Can NOT find UNIX socket file: "+ config.getSockPath(req.session.loginUsername));
          msgResponse('You are Disconnect','login-error',req.session.loginUsername,'',req,res);
        }
      }
    });
  } else {
    res.redirect('/login');
  }
});


var server = http.createServer(app);
// Proxy websockets
server.on('upgrade', function (req, socket, head) {
  if (app.sessions){
    let cookieHeader = req.headers?.cookie;
    if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), sessionSecret)
    if (cookies) var requestSessionID=cookies[sessionName];
    if (requestSessionID) var session=app.sessions[requestSessionID];
    if (session) var loginUsername=session['loginUsername'];
    if (loginUsername) {
      exec(command.checkConnect(loginUsername), (error, stdout, stderr) => {
        if (error) {console.log(`error: ${error.message}`);return;}
        if (stderr) {console.log(`error: ${stderr}`);return;}
        let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
        if (text=="true") {
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