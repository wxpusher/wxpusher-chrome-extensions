consoleLog('开始执行background.js');

init();
/**
 * 应用初始化
 */
function init() {
	initStatus();
	listenNotificationClicked();
	chrome.runtime.onInstalled.addListener((e) => {
		if (e.reason === chrome.runtime.OnInstalledReason.INSTALL) {
			chrome.tabs.create({
				'url': 'popup.html'
			});
			chrome.runtime.setUninstallURL('https://wxpusher.zjiecode.com/docs/#/');
		}
	});
	initWsConnect();
}
function initStatus(){
	var version = chrome.runtime.getManifest().version;
	setVersion(version);
	//打开的时候，长链接没有打开
	setWsConnect(false);
}

/**
 * 建立ws链接
 */
function initWsConnect() {
	wsConnect(function (wsMsg) {
		if (wsMsg.msgType === WS_MSG_TYPE_UPSH_NOTIFICATION) {
			showNotification('WxPusher通知提醒',wsMsg.content,wsMsg.url,wsMsg.qid);
			return
		}
		if (wsMsg.msgType === WS_MSG_TYPE_INIT) {
			setPushToken(wsMsg.pushToken);
			initOrUpdatePushToken(wsMsg);
			return
		}
	});
}

/**
 * 初始化设备，或者更新设别pushToken
 */
function initOrUpdatePushToken(wsInitMsg) {
	var deviceUuid = getDeviceUuid();
	var resultCallback = function (resp) {
		setDeviceUuid(resp.deviceUuid);
		setDeviceToken(resp.deviceToken);
	}
	var errorCallback = function (e) {
		//进行错误提示
	}
	if (deviceUuid) {
		updatePushToken(wsInitMsg.pushToken, deviceUuid, resultCallback, errorCallback);
		return;
	}
	//如果没有uid，需要用户点开扩展弹出页面，扫码登陆
}