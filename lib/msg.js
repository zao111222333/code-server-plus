module.exports = msg

function msg(msg,msgType,loginUsername,handleUser,req,res){
  req.session.msg=msg;
  req.session.msgType=msgType;
  switch (msgType) {
    case 'login-error':
      if (msg=='You are Disconnect'){
        req.session.login=true;
        req.session.loginUsername=loginUsername;
      } else {
        req.session.login=false;
        req.session.handleUser=handleUser;
        if (req.session.attempt) {
          req.session.attempt=req.session.attempt+1;
        } else {
          req.session.attempt=1;
        }
      }
        res.redirect('/login');
      break;
    default:
      console.log('error: Msg NO Match!');
    }
}