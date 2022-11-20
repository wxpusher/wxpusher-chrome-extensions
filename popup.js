var PERMISSON_GRANTED = "granted";
var PERMISSON_DENIED = "denied";
var PERMISSON_DEFAULT = "default";

updateInit();


function updateInit() {
	updateVersion();
	updateWsStatus();
	initBindStatus();
	updateUserStatus();
	requestPermission();
}
function updateVersion(){
	document.getElementById("version").innerText = getVersion();
}

function requestPermission() {
	// 如果用户已经允许，直接显示消息，如果不允许则提示用户授权
	if (Notification.permission === PERMISSON_GRANTED) {
		consoleLog("has permission");
	} else {
		consoleLog("req permission");
		Notification.requestPermission(function (res) {
			consoleLog("req permission resutl=" + res);
			if (res === PERMISSON_GRANTED) {
				notify(title, options);
			}
		});
	}
}

/**
 * 更新ws的链接状态
 */
function updateWsStatus() {
	var wsConnectStatus = document.getElementById("ws-connect");
	if (isWsConnect()) {
		wsConnectStatus.innerText = "已链接到服务器";
		wsConnectStatus.setAttribute("style", "color:green;")
	} else {
		wsConnectStatus.innerText = "未链接到服务器";
		wsConnectStatus.setAttribute("style", "color:red;")
	}
}
/**
 * 更新用户状态信息
 */
function updateUserStatus() {
	var userStatus = document.getElementById("user-status");
	if (getDeviceUuid() && getDeviceToken()) {
		userStatus.innerText = "已经绑定用户";
		userStatus.setAttribute("style", "color:green;")
	} else {
		userStatus.innerText = "请使用微信扫码登陆";
		userStatus.setAttribute("style", "color:red;")
	}
}

/**
 * 给用户显示红色的错误提示
 */
function showTips(msg) {
	var tipsEle = document.getElementById("tips");
	if (msg) {
		wsConnectStatus.innerText = msg;
		tipsEle.setAttribute("style", "display:block;")
		return
	}
	wsConnectStatus.innerText = "";
	tipsEle.setAttribute("style", "display:none;")

}

/**
 * 更新用户绑定状态
 */
function initBindStatus() {
	if (!isWsConnect()) {
		consoleLog('ws未链接');
		return;
	}
	var qrcodeConEle = document.getElementById("wxpusher_qrcode_container");
	var qrcodeEle = document.getElementById("wxpusher_qrcode");
	if (getDeviceUuid() && getPushToken()) {
		consoleLog('存在deviceUuid&&pushToken，无需再次绑定');
		qrcodeEle.setAttribute("style", "display:none;")
		qrcodeConEle.setAttribute("style", "display:none;")
		return;
	}
	var errorCallback = function (msg) {
		showTips(msg);
	}
	var resultCallback = function (data) {
		setDeviceUuid(data.deviceUuid)
		setDeviceToken(data.deviceToken)
		qrcodeEle.setAttribute("style", "display:none;");
		qrcodeConEle.setAttribute("style", "display:none;");
		updateUserStatus();
	}
	//没有绑定设置，这个时候只是建立了ws链接，需要用户在在pop里面扫码绑定
	createLoginQrcode(function (data) {
		qrcodeConEle.setAttribute("style", "display: flex; flex-direction: column;align-items: center;")
		qrcodeEle.setAttribute("style", "display:block;");
		qrcodeEle.setAttribute("src", getQrcodeUrl(data.code));
		loopBindPushToken(data.code, getPushToken(), resultCallback, errorCallback);
	}, errorCallback);
}

/**
 * 循环尝试绑定设备，等待用户扫码后可以绑定成功
 */
function loopBindPushToken(code, pushToken, resultCallback, errorCallback) {
	var bindInterval = setInterval(function () {
		bindPushToken(code, pushToken, getDeviceName(), function (data) {
			consoleLog('绑定设备成功，清理计时器');
			clearInterval(bindInterval);
			resultCallback && resultCallback(data);
		}, function (code, msg) {
			if (code != 10000) {
				consoleLog('非等待用户扫码状态，清理计时器');
				clearInterval(bindInterval);
			}
			errorCallback && errorCallback(msg)
		})
	}, 3000);
}