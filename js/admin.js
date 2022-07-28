function getUserInfo(element){
	const [username,admin,connect] = element.parentElement.id.split("/");
	const isAdmin = admin=='admin';
	const isConnect = connect=='connect';
	return [username,isAdmin,isConnect]
}
function setAdmin(element){
	window.location.hash = '#confirm';
	const [username,isAdmin,isConnect] = getUserInfo(element);
	const confirmInfo = isAdmin? "You will change <b>"+username+"</b> (Admin User) into Normal User." 
		: "You will change <b>"+username+"</b> (Normal User) into Admin User." ;
	$('#changepassword').css('display','none');
	$('#changepassword-check').css('display','none');
	$('#changepassword').removeAttr('required');
	$('#changepassword-check').removeAttr('required');
	$('#changepassword-icon').css('display','none');
	$('#changepassword-check-icon').css('display','none');
	document.getElementById("changeusername").value = username;
	document.getElementById('confirm-info').innerHTML = confirmInfo;
	document.getElementById('confirm-title').innerHTML = isAdmin? "Unset Admin" : "Set Admin";
	document.getElementById("changeusername").value = username;
	document.getElementById("changetype").value = "Set/Unset Admin";
	$('#changevalue').css('display','inherit');
	$('#changevalue-icon').css('display','inherit');
	document.getElementById("changevalue").value = isAdmin?"toUser":"toAdmin";
	document.getElementById("confirm-submit").value = "Confirm";
	// $('.confirm-submit').removeClass().addClass("confirm");
}
// function setConnect(element){
// 	const user = getUseruame(element);
// 	const isConnect = codeConnect.includes(user);
// 	const confirm_info = isConnect? 
// 		  "You will change <b>"+user+"</b> into <b>Disconnect</b>." 
// 		: "You will change <b>"+user+"</b> into <b>Connect</b>." ;
// 	$('#confirm_table').css('display','inherit');
// 	$('#manage_user').css('display','none');
// 	$('#changepassword').css('display','none');
// 	$('#changepassword_check').css('display','none');
// 	$('#changepassword-icon').css('display','none');
// 	$('#changepassword_check-icon').css('display','none');
// 	$('#changepassword').removeAttr('required');
// 	$('#changepassword_check').removeAttr('required');
// 	document.getElementById('confirm_info').innerHTML = confirm_info;
// 	document.getElementById('confirm_title').innerHTML = isConnect? "Disconnect User" : "Connect User";
// 	document.getElementById("changeusername").value = user;
// 	document.getElementById("changetype").value = "setConnect";
// 	$('#changevalue').css('display','inherit');
// 	$('#changevalue-icon').css('display','inherit');
// 	document.getElementById("changevalue").value = isConnect?"toDisconnect":"toConnect";
// 	document.getElementById("confirm").value = "Confirm";
// 	$('#confirm').removeClass().addClass("confirm");
// }
// function setPasswd(element){
// 	const user = getUseruame(element);
// 	const confirm_info = "You will set the password for <b>"+user+"</b>." ;
// 	$('#confirm_table').css('display','inherit');
// 	$('#manage_user').css('display','none');
// 	$('#changepassword').css('display','inherit');
// 	$('#changepassword_check').css('display','inherit');
// 	$('#changepassword-icon').css('display','inherit');
// 	$('#changepassword_check-icon').css('display','inherit');
// 	document.getElementById('confirm_info').innerHTML = confirm_info;
// 	document.getElementById('confirm_title').innerHTML = "Set Password";
// 	document.getElementById("changeusername").value = user;
// 	document.getElementById("changetype").value = "setPassword";
// 	$('#changevalue').css('display','none');
// 	$('#changevalue').removeAttr('required');
// 	$('#changevalue-icon').css('display','none');
// 	document.getElementById("confirm").value = "Confirm";
// 	$('#confirm').removeClass().addClass("confirm");
// 	console.log(element)
// }
// function setDelete(element){
// 	const user = getUseruame(element);
// 	const confirm_info = "You will delete <b>"+user+"</b>!!!"
// 	$('#confirm_table').css('display','inherit');
// 	$('#manage_user').css('display','none');
// 	$('#changepassword').css('display','none');
// 	$('#changepassword_check').css('display','none');
// 	$('#changepassword-icon').css('display','none');
// 	$('#changepassword_check-icon').css('display','none');
// 	$('#changepassword').removeAttr('required');
// 	$('#changepassword_check').removeAttr('required');
// 	document.getElementById('confirm_info').innerHTML = confirm_info;
// 	document.getElementById('confirm_title').innerHTML = "Delete User";
// 	document.getElementById("changeusername").value = user;
// 	document.getElementById("changetype").value = "setDelete";
// 	$('#changevalue').css('display','none');
// 	$('#changevalue-icon').css('display','none');
// 	document.getElementById("changevalue").value = "";
// 	document.getElementById("confirm").value = "Delete";
// 	$('#confirm').removeClass().addClass("delete");
// }
// function toggleCheckbox(element) {
//    if (element.checked){
// 	$('.newuser').removeClass().addClass("newadmin");
// 	$('#checkbox-server').removeClass("checkbox-user").addClass("checkbox-admin");
// 	$('#checkbox-sudo').removeClass("checkbox-user").addClass("checkbox-admin");
//   } else {
// 	$('.newadmin').removeClass().addClass("newuser");
// 	$('#checkbox-server').removeClass("checkbox-admin").addClass("checkbox-user");
// 	$('#checkbox-sudo').removeClass("checkbox-admin").addClass("checkbox-user");
//   }
//  }	