var http = require('http');
var httpProxy = require('http-proxy');
var express = require('express');
var session = require("express-session");
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var crypto = require("crypto");
// PAM need run as ROOT user!!!
var pam = require('authenticate-pam');
const { exec } = require("child_process");
const fs = require("fs");
const path = require('path');

const args = process.argv.slice(2);
const userAdmin = process.env.CODE_ADMIN;
const userGroup = process.env.CODE_GROUP;
const sessionName = "code-server-plus-session";
const sessionSecret = crypto.randomBytes(20).toString('hex');

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}
function getSocketPath(userName) {
  return path.join(process.env.SOCK_DIR, 'code-server@'+userName+'.sock')
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
	if (username && password) {
    exec("members "+userGroup, (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          loginErr('Invalid Username',username,req,res);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          loginErr('Invalid Username',username,req,res);
          return;
      }
      let text = stdout.replaceAll(/(\r\n|\n|\r)/gm, '');
      const members = text.split(" ");
      if (members.includes(username)) {
        pam.authenticate(username, password, function(err) {
          if (err) {
            loginErr('Incorrect Password',username,req,res);
          }else {
            console.log("Login: username="+username);
            req.session.login = true;
            req.session.errMsg = '';
            req.session.userName = username;
            req.session.attempt=0;
            if (username==userAdmin) {
              res.redirect('/admin');
            } else {
              res.redirect('/');
            }
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
  if (req.session.userName==userAdmin) {
    // res.send("管理界面");
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
      res.send(data);
    });
  } else {
    res.sendFile(path.join(__dirname + '/static/admin_no_right.html'));
  }
});

app.post('/admin/create_user', function(req, res) {
  if (req.session.userName==userAdmin) {
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
        createErr(error.message,newusername,req,res);
        return;
      }
      if (stderr) {
        createErr(stderr,newusername,req,res);
        return;
      }
      const allUsers = stdout.split('\n');
      if (allUsers.includes(newusername)) {
        createErr("User Already Exist",newusername,req,res);
      } else {
        // const command = "/bin/bash /docker/code-server-plus/script/create_user.sh "+newusername+" "+newpassword+" "+sudo;
        let command = "/bin/bash "+path.join(__dirname + '/script/create_user.sh')+" "+newusername+" "+newpassword+" "+sudo;
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            createErr(error.message,newusername,req,res);
            return;
          }
          if (stderr) {
            console.log(`error: ${stderr}`);
            createErr(stderr,newusername,req,res);
            return;
          }
          console.log("Create New User: username="+newusername+" enable_SUDO="+sudo);
          if (server) {
            let command = "/bin/bash "+path.join(__dirname + '/script/start_server.sh')+" "+newusername;
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
    res.redirect('/admin');
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
    if (fs.existsSync(socketPath)) {
      proxy.web(req, res, {
        target: {
          socketPath: socketPath
        }
      });
    } else {
      console.log("ERROR: Can NOT find UNIX socket file: "+ socketPath);
      res.send("ERROR: Can NOT find UNIX socket file: "+ socketPath);
    }
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
        res.send("ERROR: Can NOT find UNIX socket file: "+ socketPath);
      }
    }
  }
});


if (isNumeric(args[0])) {
  const port = args[0];
  server.listen(args[0]);
} else {
  console.log("warning: "+args[0]+" is NOT a number! ");
  console.log("         Turn on socket mode, HTTP server will listen on "+path.join(__dirname, args[0]));
  server.listen(args[0]);
}