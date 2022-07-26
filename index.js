var http = require('http');
var httpProxy = require('http-proxy');
const modifyResponse = require('http-proxy-response-rewrite')
var url = require('url') ;
var express = require('express');
var session = require("express-session");
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var crypto = require("crypto");
var pam = require('authenticate-pam');
const { exec } = require("child_process");
const fs = require("fs");
const path = require('path');

const args = process.argv.slice(2);

// TODO: Multi Group
const userGroup = 'coder';
const SOCK_DIR = '/var/run';
// const connectNoRootUser = false;
const connectNoRootUser = true;


const sessionName = "code-server-plus-session";
const sessionSecret = crypto.randomBytes(20).toString('hex');

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}
function toStringList (list) {
  return "['" + list.join("','") + "']"
}
function getSocketPath(userName) {
  return path.join(SOCK_DIR, 'code-server@'+userName+'.sock')
}

function loginErr(errMsg,username,req,res) {
  req.session.login=false;
  req.session.errMsg=errMsg;
  req.session.errType="login";
  req.session.userName=username;
  if (req.session.attempt) {
    req.session.attempt=req.session.attempt+1;
  } else {
    req.session.attempt=1;
  }
  res.redirect('/login');
}

function createErr(errMsg,newusername,req,res) {
  req.session.msgType='create user';
  req.session.msg='';
  req.session.errType="create user";
  req.session.errMsg="User already exist";
  req.session.newusername=newusername;
  req.session.errMsg=errMsg;
  res.redirect('/admin');
}

const isRoot = process.getuid && process.getuid() === 0;;
if (!isRoot){
  console.error('Error: Need bo be root')
}

// create a server
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
app.use('/code-server-plus/static',express.static(path.join(__dirname, '/static')));
app.use(require('./middlewares/sessions.js'));

var proxy = httpProxy.createProxyServer({ ws: true });
var server = http.createServer(app);
// Listen for the `proxyRes` event on `proxy`.
proxy.on('proxyRes', function (proxyRes, req, res) {
  modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
      var pathname = url.parse(req.url).pathname;
      if (pathname=='/' && body) {
        let userName='';
        let isAdmin=false;
        if (app.sessions){
          let cookieHeader = req.headers?.cookie;
          if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), sessionSecret)
          if (cookies) var requestSessionID=cookies[sessionName];
          if (requestSessionID) var session=app.sessions[requestSessionID];
          if (session) {
            userName=session['userName'];
            isAdmin=session['isAdmin'];
          };
        }
        const style = '<link rel="stylesheet" type="text/css" href="/code-server-plus/static/index.css">';
        const htmldAdmin = isAdmin? '<a href="/admin"><label class="head-link">Admin</label></a>':'';
        const html = `
          <div class="header">
            <label>Hi, ${userName}</label>
            ${htmldAdmin}
            <a href="/logout"><label class="head-link">Logout</label></a>
          </div>
        `;
        var body = body.replace('<body aria-label="">', '<body aria-label="">'+html);
        var body = body.replace('</head>', style+'</head>');
      }
      return body;
  });
});


// logout
app.get("/logout", function (req, res) {
  if (req.session.login) {
    res.sendFile(path.join(__dirname + '/static/logout.html'));
  } else {
    res.sendFile(path.join(__dirname + '/static/logout_not_login.html'));
  }
});
app.post('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/login');
});

// login
app.get('/login', function(req, res) {
  const limit = req.session.attempt >= 5;
  fs.readFile(path.join(__dirname + '/static/login.html'), 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var data = data.replace('limit = false', 'limit = '+limit);
    if (req.session.errMsg) var data = data.replace('errMsg = \'\'', 'errMsg = \''+req.session.errMsg+'\'');
    if (req.session.errType) var data = data.replace('errType = \'\'', 'errType = \''+req.session.errType+'\'');
    if (req.session.attempt) var data = data.replace('attempt = \'\'', 'attempt = \''+req.session.attempt+'\'');
    if (req.session.userName) var data = data.replace('username = \'\'', 'username = \''+req.session.userName+'\'');
    res.send(data);
  });
});
app.post('/login', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
	let toAdmin = req.body.toAdmin;
	if (username && password) {
    exec("members "+userGroup, (error, stdout, stderr) => {
      if (error) {console.log(`error: ${error.message}`);return;}
      if (stderr) {console.log(`stderr: ${stderr}`);return;}
      let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
      const members = text.split(" ");
      if (members.includes(username)) {
        pam.authenticate(username, password, function(err) {
          if (err) {
            loginErr('Incorrect Password',username,req,res);
          }else {
            exec("members sudo", (error, stdout, stderr) => {
              if (error) {console.log(`error: ${error.message}`);return;}
              if (stderr) {console.log(`stderr: ${stderr}`);return;}
              let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
              const allAdmins = text.split(" ");
              if (allAdmins.includes(username)) {
                req.session.isAdmin = isAdmin = true;
              } else {
                req.session.isAdmin = isAdmin = false;
              }
              console.log("Login: username="+username);
              req.session.login = true;
              req.session.errMsg = '';
              req.session.userName = username;
              req.session.attempt=0;
              if (toAdmin) {
                res.redirect('/admin');
              } else {
                res.redirect('/');
              }
            });            
          }
        });
      } else {
        loginErr('Invalid Username',username,req,res);
      }
    });
  } else {
    loginErr('EMPTY Username / Password',username,req,res);
  }
});


// admin
app.get('/admin', function(req, res) {
  function genUserCard (username, isAdmin, codeConnect){
    if (!username==''){
      const isConnect = codeConnect.includes(username);
      const admin = isAdmin ? 'admin' : 'user';
      const name = (username==req.session.userName) ? username+' (YOU)' : username;
      const connect = isConnect ? 'connect' : 'disconnect';
      var html = `
<div class="user-card" id="user-card/${username}">
<label class="user-lable icon-${admin}" onclick="setAdmin(this)"><i class="fa-solid fa-user"></i></label>
<div class="user-info">${name}</div>
<label class="user-lable icon-${connect}" onclick="setConnect(this)"><i class="fas fa-network-wired"></i></label>
<label class="user-lable icon-key" onclick="setPasswd(this)"><i class="fa-solid fa-key-skeleton"></i></label>
<label class="user-lable icon-delete" onclick="setDelete(this)"><i class="fas fa-trash-alt"></i></label>
</div>
`;
      return html
    } else {
      return ''
    }
  }
  if (req.session.login) {
    let allAdmins = '';
    exec("members sudo", (error, stdout, stderr) => {
      if (error) {console.log(`error: ${error.message}`);return;}
      if (stderr) {console.log(`stderr: ${stderr}`);return;}
      let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
      allAdmins = text.split(" ");
      if (allAdmins.includes(req.session.userName)) {
        // login to admin
        // req.session.isAdmin = true;
        let allUsers = '';
        exec("members "+userGroup, (error, stdout, stderr) => {
          if (error) {console.log(`error: ${error.message}`);return;}
          if (stderr) {console.log(`stderr: ${stderr}`);return;}
          let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
          allUsers = text.split(" ");
          let command = "/bin/bash "+path.join(__dirname + '/script/list_sock_user.sh')+" "+SOCK_DIR;
          exec(command, (error, stdout, stderr) => {
            if (error) {console.log(`error: ${error.message}`);return;}
            if (stderr) {console.log(`stderr: ${stderr}`);return;}
            let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
            let codeConnect = text.split(" ");
            let codeUsers = [];
            let codeAdmins = [];
            allUsers.forEach((user, i) => {
              if (allAdmins.includes(user)) {
                codeAdmins.push(user);
              } else {
                codeUsers.push(user);
              }
            });
            fs.readFile(path.join(__dirname + '/static/admin.html'), 'utf8', function (err,data) {
              if (err) {
                return console.log(err);
              }
              if (req.session.msg) var data = data.replace('msg = \'\'', 'msg = \''+req.session.msg+'\'');
              if (req.session.msgType) var data = data.replace('msgType = \'\'', 'msgType = \''+req.session.msgType+'\'');
              if (req.session.errMsg) var data = data.replace('errMsg = \'\'', 'errMsg = \''+req.session.errMsg+'\'');
              if (req.session.errType) var data = data.replace('errType = \'\'', 'errType = \''+req.session.errType+'\'');
              if (req.session.attempt) var data = data.replace('attempt = \'\'', 'attempt = \''+req.session.attempt+'\'');
              if (req.session.userName) var data = data.replace('username = \'\'', 'username = \''+req.session.userName+'\'');
              if (req.session.newusername) var data = data.replace('newusername = \'\'', 'newusername = \''+req.session.newusername+'\'');
              codeUsers.sort();
              codeAdmins.sort();
              codeConnect.sort();
              var data = data.replace('codeUsers = \[\]', 'codeUsers = '+toStringList(codeUsers));
              var data = data.replace('codeAdmins = \[\]', 'codeAdmins = '+toStringList(codeAdmins));
              var data = data.replace('codeConnect = \[\]', 'codeConnect = '+toStringList(codeConnect));
              var userData = genUserCard(req.session.userName,true,codeConnect);
              codeAdmins.forEach((user, i) => {
                userData = (req.session.userName==user)?userData:userData+genUserCard(user,true,codeConnect);
              });
              codeUsers.forEach((user, i) => {
                userData = userData+genUserCard(user,false,codeConnect);
              });
              var data = data.replace('<!-- User Info -->', userData);
              res.send(data);
            });
          });
        });
      } else {
        res.sendFile(path.join(__dirname + '/static/admin_no_right.html'));
      }
    });
  } else {
    res.sendFile(path.join(__dirname + '/static/admin_no_right.html'));
  }
});

app.post('/admin/create_user', function(req, res) {
  if (req.session.isAdmin) {
      let newusername = req.body.newusername;
      let newpassword = req.body.newpassword;
      let newpassword_check = req.body.newpassword_check;
      let sudo = true;
      if (req.body.sudo) {
        sudo = true;
      } else {
        sudo = false;
      }
      let server = true;
      if (req.body.server) {
        server = true;
      } else {
        server = false;
      }
      if (!(newpassword_check==newpassword)) {
        createErr("Passwords Do NOT Match",newusername,req,res);
        return;
      };
      exec("awk -F\':\' \'{ print \$1}\' /etc/passwd", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`error: ${stderr}`);
          return;
        }
        const allUsers = stdout.split('\n');
        if (allUsers.includes(newusername)) {
          createErr("User Already Exist",newusername,req,res);
        } else {
          let command = "/bin/bash "+path.join(__dirname + '/script/newuser_create.sh')+" "+newusername+" "+newpassword+" "+sudo+" "+userGroup;
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.log(`error: ${error.message}`);
              return;
            }
            if (stderr) {
              console.log(`error: ${stderr}`);
              return;
            }
            console.log("Create New User: username="+newusername+" enable_SUDO="+sudo);
            if (server) {
              let command = "/bin/bash "+path.join(__dirname + '/script/start_server.sh')+" "+newusername+" "+SOCK_DIR;
              exec(command);
              console.log("Start Server: username="+newusername);
            }
            req.session.newusername=newusername;
            req.session.msg='Success';
            req.session.msgType='create user';
            req.session.errMsg='';
            req.session.errType='';
            res.redirect('/admin');
          });
        }
      });
    } else {
      res.redirect('/');
    }
});

app.get('/webdav', function(req, res) {
  if (req.session.login) {
    res.send("管理界面");
  } else {
    res.send("无权限");
  }
});

app.get('/*', function(req, res) {
  if (req.session.login) {
    const socketPath = getSocketPath(req.session.userName);
    let command = "/bin/bash "+path.join(__dirname + '/script/check_sock.sh')+" "+socketPath;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`error: ${stderr}`);
        return;
      }
      let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
      if (text=="true") {
        proxy.web(req, res, {
          target: {
            socketPath: socketPath
          }
        });
      } else {
        console.log("ERROR: Can NOT find UNIX socket file: "+ socketPath);
        loginErr('You are Disconnect', req.session.userName,req,res);
      }
    });
  } else {
    res.redirect('/login');
  }
});

// Proxy websockets
server.on('upgrade', function (req, socket, head) {
  if (app.sessions){
    let cookieHeader = req.headers?.cookie;
    if (cookieHeader) var cookies=cookieParser.signedCookies(cookie.parse(cookieHeader), sessionSecret)
    if (cookies) var requestSessionID=cookies[sessionName];
    if (requestSessionID) var session=app.sessions[requestSessionID];
    if (session) var userName=session['userName'];
    if (userName) {
      const socketPath = getSocketPath(userName);
      if (fs.existsSync(socketPath)) {
        proxy.ws(req, socket, head,{target: {
          socketPath: socketPath
        }});
      } else {
        console.log("ERROR: Can NOT find UNIX socket file: "+ socketPath);
        // res.send("ERROR: Can NOT find UNIX socket file: "+ socketPath);
        loginErr('You\'re Disconnect', userName,req,res);
      }
    }
  }
});

let allAdmins = '';
let allUsers = '';
exec("members sudo", (error, stdout, stderr) => {
  if (error) {console.log(`error: ${error.message}`);return;}
  if (stderr) {console.log(`stderr: ${stderr}`);return;}
  let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
  allAdmins = text.split(" ");
  exec("members "+userGroup, (error, stdout, stderr) => {
    if (error) {console.log(`error: ${error.message}`);return;}
    if (stderr) {console.log(`stderr: ${stderr}`);return;}
    let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
    allUsers = text.split(" ");
      allUsers.forEach((user, i) => {
        let command = "/bin/bash "+path.join(__dirname + '/script/start_server.sh')+" "+user+" "+SOCK_DIR;
        if (allAdmins.includes(user)) {
          exec(command);
          console.log("Start Server: admin user="+user);
        } else {
          if (connectNoRootUser) {
            exec(command);
            console.log("Start Server: user="+user);
          }
        }
      });
  });
});


if (isNumeric(args[0])) {
  const port = args[0];
  server.listen(args[0]);
} else {
  console.log("warning: "+args[0]+" is NOT a number! ");
  console.log("         Turn on socket mode, HTTP server will listen on "+path.join(__dirname, args[0]));
  server.listen(args[0]);
}