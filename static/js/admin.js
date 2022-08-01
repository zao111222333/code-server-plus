var script = document.createElement('script');
script.src = '/code-server-plus/js/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild(script);

const msg = document.currentScript.getAttribute('msg');
const msgType = document.currentScript.getAttribute('msgType');
const username = document.currentScript.getAttribute('username');
const hasSetAdmin = document.currentScript.getAttribute('hasSetAdmin')=='true';

window.onload = function(){
	$(window).on('hashchange', function(){
		$('.card').css('display','none');
		$(window.location.hash).css('display','');
	}).trigger('hashchange');
	if (!window.location.hash) {
		window.location.href = '#manage'; 
	}
	if (hasSetAdmin) {
		$('input[name=setAdmin]').prop('checked', true);
		$('.icon-login-user').removeClass('icon-login-user').addClass("icon-login-admin");
		$('.create-user').removeClass("create-user").addClass("create-admin");
		$('.checkbox-user').removeClass("checkbox-user").addClass("checkbox-admin");
	}
	document.getElementById("username").value = username;
	switch (msgType) {
		case 'create-user-success':
			document.getElementById('create-msg').innerHTML = msg;
			$('#create-msg').removeClass().addClass("msg msg-success");
			document.getElementById('create-return').value = "OK";
			$('#create-submit').css('display','none');
			if (hasSetAdmin) {
				$('#create-return').removeClass().addClass("create-admin");
			} else {
				$('#create-return').removeClass().addClass("create-user");
			}
		  break;
		case 'create-user-error':
			document.getElementById('create-msg').innerHTML = msg;
			$('#create-msg').removeClass().addClass("msg msg-error");
			break;
		case 'manage-error':
			document.getElementById('confirm-msg').innerHTML = msg;
			$('#confirm-msg').removeClass().addClass("msg msg-error");
		  	break;
		default:
		  	console.log('unknow msgType: '+msgType);
	}
}

function createReturn(){
	document.getElementById('create-return').value = "Cancel";
	$('#create-return').removeClass();
	$('#create-submit').css('display','');
	var xhr = new XMLHttpRequest();
	xhr.open("POST", '/admin/create', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
	    retrunType: msgType=='create-user-success'? 'ok':'cancel'
	}));
	window.location.hash = '#manage'
}

function getUserInfo(element){
	const [username,admin,connect] = element.parentElement.id.split("/");
	const isAdmin = admin=='admin';
	const isConnect = connect=='connect';
	return [username,isAdmin,isConnect]
}
function setAdmin(element){
	window.location.hash = '#confirm';
	document.getElementById('confirm-msg').innerHTML = '';
	const [username,isAdmin,isConnect] = getUserInfo(element);
	const confirmInfo = isAdmin? "You will change <b>"+username+"</b> (Admin User) into Normal User." 
		: "You will change <b>"+username+"</b> (Normal User) into Admin User." ;
	document.getElementById('confirm-info').innerHTML = confirmInfo;
	document.getElementById('confirm-title').innerHTML = isAdmin? "Unset Admin" : "Set Admin";
	document.getElementById("changeusername").value = username;
	document.getElementById("changetype").value = "setAdmin";
	document.getElementById("changevalue").value = isAdmin?"toUser":"toAdmin";
	document.getElementById("confirm-submit").value = "Confirm";
	$('.user-card').css('display','');
	$('.changepassword-card').css('display','none');
	$('.changepasswordCheck-card').css('display','none');
	$('.changepassword-card').removeAttr('required');
	$('.changepasswordCheck-card').removeAttr('required');
	$('.confirm-submit').removeClass().addClass("confirm");
}
function setConnect(element){
	window.location.hash = '#confirm';
	document.getElementById('confirm-msg').innerHTML = '';
	const [username,isAdmin,isConnect] = getUserInfo(element);
	const confirmInfo = isConnect? 
		  "You will change <b>"+username+"</b> into <b>Disconnect</b>." 
		: "You will change <b>"+username+"</b> into <b>Connect</b>." ;
	document.getElementById('confirm-info').innerHTML = confirmInfo;
	document.getElementById('confirm-title').innerHTML = isConnect? "Disconnect User" : "Connect User";
	document.getElementById("changeusername").value = username;
	document.getElementById("changetype").value = "setConnect";
	document.getElementById("changevalue").value = isConnect?"toDisconnect":"toConnect";
	document.getElementById("confirm-submit").value = "Confirm";
	$('.user-card').css('display','');
	$('.changepassword-card').css('display','none');
	$('.changepasswordCheck-card').css('display','none');
	$('.changepassword-card').removeAttr('required');
	$('.changepasswordCheck-card').removeAttr('required');
	$('.confirm-submit').removeClass().addClass("confirm");
}

function setPassword(element){
	window.location.hash = '#confirm';
	document.getElementById('confirm-msg').innerHTML = '';
	const [username,isAdmin,isConnect] = getUserInfo(element);
	const confirmInfo = "You will set the password for <b>"+username+"</b>." ;
	document.getElementById('confirm-info').innerHTML = confirmInfo;
	document.getElementById('confirm-title').innerHTML = "Set Password";
	document.getElementById("changeusername").value = username;
	document.getElementById("changetype").value = "setPassword";
	document.getElementById("confirm-submit").value = "Confirm";
	document.getElementById("changevalue").value = "";
	$('.user-card').css('display','');
	$('.changevalue-card').css('display','none');
	$('#changepassword').removeAttr('readonly');
	$('#changepasswordCheck').removeAttr('readonly');
	$('#changepassword').prop('required', true);
	$('#changepasswordCheck').prop('required', true);
	$('#confirm-submit').removeClass().addClass("confirm");
}
function setDelete(element){
	window.location.hash = '#confirm';
	document.getElementById('confirm-msg').innerHTML = '';
	const [username,isAdmin,isConnect] = getUserInfo(element);
	const confirmInfo = "You will delete <b>"+username+"</b>!!!"
	document.getElementById('confirm-info').innerHTML = confirmInfo;
	document.getElementById('confirm-title').innerHTML = "Delete User";
	document.getElementById("changeusername").value = username;
	document.getElementById("changetype").value = "setDelete";
	document.getElementById("changevalue").value = "";
	$('.user-card').css('display','');
	$('.changevalue-card').css('display','none');
	$('.changepassword-card').css('display','none');
	$('.changepasswordCheck-card').css('display','none');
	$('.changepassword-card').removeAttr('required');
	$('.changepasswordCheck-card').removeAttr('required');
	document.getElementById("confirm-submit").value = "Delete";
	$('#confirm-submit').removeClass().addClass("delete");
}
function toggleAdminUser(element) {
  if (element.checked){
		$('.icon-login-user').removeClass('icon-login-user').addClass("icon-login-admin");
		$('.create-user').removeClass("create-user").addClass("create-admin");
		$('.checkbox-user').removeClass("checkbox-user").addClass("checkbox-admin");
  } else {
		$('.icon-login-admin').removeClass('icon-login-admin').addClass("icon-login-user");
		$('.create-admin').removeClass("create-admin").addClass("create-user");
		$('.checkbox-admin').removeClass("checkbox-admin").addClass("checkbox-user");
  }
}

function toggleSetAdmin(){
	$('input[name=setAdmin]').trigger('click'); 
}
function toggleSetConnect(){
	$('input[name=setConnect]').trigger('click'); 
}