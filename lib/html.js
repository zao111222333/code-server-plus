module.exports.genUserCard = genUserCard
module.exports.genMenuBar = genMenuBar

function genUserCard (loginUsername, users, admins, connectUser){
  function genOneCard (username, isAdmin) {
    if (!username==''){
      const isConnect = connectUser.includes(username);
      const admin = isAdmin ? 'admin' : 'user';
      const name = (username==loginUsername) ? username+' (YOU)' : username;
      const connect = isConnect ? 'connect' : 'disconnect';
      return `
      <div class="user-card" id="${username}/${admin}/${connect}">
      <label class="user-lable icon-${admin}" onclick="setAdmin(this)"><i class="fa-solid fa-user"></i></label>
      <div class="user-info">${name}</div>
      <label class="user-lable icon-${connect}" onclick="setConnect(this)"><i class="fas fa-network-wired"></i></label>
      <label class="user-lable icon-key" onclick="setPassword(this)"><i class="fa-solid fa-key-skeleton"></i></label>
      <label class="user-lable icon-delete" onclick="setDelete(this)"><i class="fas fa-trash-alt"></i></label>
      </div>
      `
    } else {
      return ''
    }
  }
  var html = genOneCard('root',true);
  html = (loginUsername=='root') ? html : html+genOneCard(loginUsername,true);
  admins.forEach((user, i) => {
    html = (user==loginUsername||user=='root') ? html : html+genOneCard(user,true);
  });
  users.forEach((user, i) => {
    html = html+genOneCard(user,false);
  });
  return html
}

function genMenuBar (username,isAdmin) {
  const adminMenu = isAdmin? '<a href="/admin"><label class="header-link">Admin</label></a>':'';
  return`
    <div class="header">
      <label>Hi, ${username}</label>
      ${adminMenu}
      <a href="/logout"><label class="header-link">Logout</label></a>
    </div>
  `
}