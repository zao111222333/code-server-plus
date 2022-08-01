var script = document.createElement('script');
script.src = '/code-server-plus/js/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild(script);

var sec = 10;
const limit = document.currentScript.getAttribute('limit')=='true';
const msg = document.currentScript.getAttribute('msg');
const msgType = document.currentScript.getAttribute('msgType');
const attempt = document.currentScript.getAttribute('attempt');
const username = document.currentScript.getAttribute('username');

window.onload = function(){
    if (msgType=="login-error") document.getElementById('msg-error').innerHTML = msg;
    document.getElementById("username").value = username;
    if (limit) {
        document.getElementById('msg-reminder').innerHTML = "Attempt Times: "+attempt;
        countDown()
    } else {
        enableSubmit();
    }
};
function countDown() {
    if (sec < 10) {
        document.getElementById("submit").value = "0" + sec;
    } else {
        document.getElementById("submit").value = sec;
    }
    if (sec <= 0) {
        enableSubmit();
        return;
    }
    sec -= 1;
    window.setTimeout(countDown, 1000);
}
function enableSubmit() {
    $("#submit").removeAttr("disabled");
    $('#submit').get(0).type = 'submit';
    document.getElementById("submit").value = "Login";
}
function toggleToAdmin(){
    $('input[name=toAdmin]').trigger('click'); 
}