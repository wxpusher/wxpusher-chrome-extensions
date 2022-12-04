
updateInit();


function updateInit() {
	updateVersion();
	updateWsStatus();
	initBindStatus();
	updateUserStatus();
	showUpdateTips();
	listenSwitch();
}

// {
// 	"title":"升级提示",
// 	"content":"新的版本，请你升级",
// 	"version":"1.0.1",
// 	"must":false,//是否必须升级，true表示强制，不升级没法用
// 	"url":"http://m.baidu.com" //升级的链接
// }
//检查更新
function showUpdateTips() {
	checkUpdate(function (isUpdate, data) {
		if (!isUpdate) {
			consoleLog("无需升级");
			return
		}
		consoleLog(JSON.stringify(data));
		var ele = " (<a target='_blank' style='color:red;' href='" + data.url + "'>新版本：" + data.version + "</a>)"
		consoleLog("升级=" + ele);
		document.getElementById("update_tips").innerHTML = ele;
		if (data.must) {
			updateWsStatus("请升级");
		}
	})
}

function listenSwitch() {
	//监听是否打开通知声音Ô
	var btn = document.getElementsByName("sound");
	if (getNotificationAudio()) {
		btn[0].setAttribute("checked", 'true')
	} else {
		console.log("checked=f")
		btn[1].setAttribute("checked", 'true')
	}
	btn[0].addEventListener("click", function (e) {
		setNotificationAudio(true)
	})
	btn[1].addEventListener("click", function (e) {
		setNotificationAudio(false)
	})
}
function updateVersion() {
	document.getElementById("version").innerText = getVersion();
}

/**
 * 更新ws的链接状态
 */
function updateWsStatus(tips) {
	var wsConnectStatus = document.getElementById("ws-connect");
	if (isWsConnect()) {
		wsConnectStatus.innerText = "已链接到服务器";
		wsConnectStatus.setAttribute("style", "color:green;")
	} else {
		var text = "未链接到服务器";
		if (tips) {
			text = text + "，" + tips
		}
		wsConnectStatus.innerText = text;
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