module.exports = msg

function msg(msg,msgType,username,req,res){
  req.session.msg=msg;
  req.session.msgType=msgType;
  switch (msgType) {
    case 'login-error':
      if (msg=='You are Disconnect'){
        req.session.login=true;
        req.session.loginUsername=username;
      } else {
        req.session.login=false;
        req.session.handleUsername=username;
        if (req.session.attempt) {
          req.session.attempt=req.session.attempt+1;
        } else {
          req.session.attempt=1;
        }
      }
        res.redirect('/login');
      break;
    case 'create-user-error':
      req.session.handleUsername=username;
      res.redirect('/admin#create');
      break;
    default:
      console.log('error: MsgType NO Match: '+msgType);
    }
}