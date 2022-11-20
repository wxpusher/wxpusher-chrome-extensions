//ws服务器下发消息类型枚举
var WS_MSG_TYPE_HEART = 201;//收到心跳响应
var WS_MSG_TYPE_INIT = 202;//收到服务器下发初始化信息
var WS_MSG_TYPE_ERROR = 203;//错误提示
var WS_MSG_TYPE_UPDATE = 204;//升级提示
var WS_MSG_TYPE_UPSH_NOTIFICATION = 20001;//推送的通知消息


//是否是打开扩展程序的页面
var inExtension = (location.href.indexOf('chrome-extension://') === 0) ? true : false;

/**
 * 发送一个简单的http请求
 */
function sajax(method, url, callback, errorCallback) {
	ajax(method, url, undefined, undefined, callback, errorCallback);
}

/**
 * 发送一个http请求
 * 携带公共参数
 */
function ajax(method, url, data, header, callback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.open((method || 'GET'), url, true);
	if (header) {
		for (var key in header) {
			xhr.setRequestHeader(key, header[key]);
		}
	}
	xhr.setRequestHeader('platform', getPlatform());
	xhr.setRequestHeader('version', getVersion());
	xhr.setRequestHeader('deviceToken', getDeviceToken());
	xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
	xhr.withCredentials = false;
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			//请求完成
			callback && callback(xhr.status, xhr.responseText);
		}
	}
	xhr.onerror = function (e) {
		errorCallback && errorCallback(e);
	}
	xhr.send(JSON.stringify(data));
}


/**
 * 建立ws链接
 */
function wsConnect(callback) {
	var version = chrome.runtime.getManifest().version;
	var platform = 'Chrome-';
	var deviceName = '';
	//获取环境信息
	chrome.runtime.getPlatformInfo((info) => {
		if (info.os == 'win') {
			platform += 'Windows'
		} else if (info.os == 'mac') {
			platform += 'Mac'
		} else {
			platform += 'Other'
		}
		//在内存存储一次这些数据，方便后续请求私用
		setVersion(version);
		setPlatform(platform);
		deviceName = platform + "-" + info.arch;
		setDeviceName(deviceName);
		var wsUrl = wsHost + '/ws?version=' + version + '&platform=' + platform;
		var pushToken = getPushToken();
		if (pushToken) {
			wsUrl += '&pushToken=' + pushToken;
		}
		socket = new WebSocket(wsUrl);
		socket.onopen = function (e) {
			consoleLog('webSocket连接成功');
			setWsConnect(true)
		};
		socket.onclose = function (event) {
			consoleLog("webSocket连接关闭")
			setWsConnect(false)
		};
		socket.onmessage = function (e) {
			var msg = JSON.parse(e.data);
			if (typeof msg !== 'object') {
				consoleLog('长链接消息内容错误');
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_HEART) {
				consoleLog('收到心跳响应');
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_INIT) {
				consoleLog('收到服务器下发初始化信息！');
				callback && callback(msg)
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_UPDATE) {
				//TODO 升级提示
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_UPSH_NOTIFICATION) {
				callback && callback(msg);
				return;
			}
		}
	})
}

function consoleLog(str) {
	console.log('[' + getSysDateFormat() + ']：' + str);
}

function playAudio(file_url) {
	var bell_url = chrome.runtime.getURL(file_url);
	var audio = new Audio(bell_url);
	audio.loop = false;
	audio.play();
}

function showNotification(title, text, url) {
	var notification_audio = localStorage['notification_audio'] * 1;
	var notification_display = localStorage['notification_display'] * 1;
	if (notification_audio !== 0) {
		playAudio('music/breeze.mp3');
	}
	chrome.notifications.create({
		'type': 'basic',
		'title': title || 'WxPusher通知提醒',
		'message': text,
		'silent': true,
		'requireInteraction': true,
		'iconUrl': 'icon/128.png'
	}, (id) => {
		if (url) {
			var notification_arr = JSON.parse(localStorage['notification_arr'] || '[]');
			notification_arr.push(id + '|' + url);
			while (notification_arr.length > 100) {
				notification_arr.splice(0, 1);
			}
			localStorage['notification_arr'] = JSON.stringify(notification_arr);
		}
	});
}

function notificationsOnClicked() {
	chrome.notifications.onClicked.addListener((id) => {
		var notification_arr = JSON.parse(localStorage['notification_arr'] || '[]');
		for (var i = 0; i < notification_arr.length; i++) {
			if (notification_arr[i].indexOf(id + '|') === 0) {
				chrome.tabs.create({ 'url': (notification_arr[i].split('|'))[1] });
				notification_arr.splice(i, 1);
				break;
			}
		}
		localStorage['notification_arr'] = JSON.stringify(notification_arr);
	});
}

Date.prototype.Format = function (fmt) {
	var o = {
		"M+": this.getMonth() + 1,
		"d+": this.getDate(),
		"h+": this.getHours(),
		"m+": this.getMinutes(),
		"s+": this.getSeconds(),
		"q+": parseInt((this.getMonth() + 3) / 3),
		"S": this.getMilliseconds()
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}
function getSysTime() {
	return Date.now();
}
function getSysDateFormat() {
	return (new Date()).Format("yyyy-MM-dd hh:mm:ss.S");
}
function getSysDateFormat2() {
	return (new Date()).Format("yyyy-MM-dd");
}
function getSysDateFormat3() {
	return (new Date()).Format("hh:mm:ss.S");
}
