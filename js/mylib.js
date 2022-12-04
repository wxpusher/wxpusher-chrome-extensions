//ws服务器下发消息类型枚举
var WS_MSG_TYPE_HEART_UP = 101;//上行心跳响应
var WS_MSG_TYPE_HEART = 201;//下行心跳响应
var WS_MSG_TYPE_INIT = 202;//收到服务器下发初始化信息
var WS_MSG_TYPE_ERROR = 203;//错误提示
var WS_MSG_TYPE_UPDATE = 204;//升级提示
var WS_MSG_TYPE_UPSH_NOTIFICATION = 20001;//推送的通知消息

//发送心跳的任务
var heartInterval = undefined;
//ws长链接
var socket = undefined;

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
		if (socket && (socket.readyState == 1 || socket.readyState == 2)) {
			consoleLog('WS当前链接存在或者链接中，暂时不进行链接,readyState=' + socket.readyState);
			return;
		}
		consoleLog("开始ws的链接,ws=" + wsUrl);
		socket = new WebSocket(wsUrl);
		//如果没有启动心跳管理，需要启动心跳管理
		startWsHeartLoop(callback);

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
				consoleLog(JSON.stringify(msg))
				consoleLog("当前插件版本过低，请升级插件，url=" + msg.url)
				clearInterval(heartInterval)
				heartInterval = undefined
				showNotification(msg.title,msg.content,msg.url);
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_UPSH_NOTIFICATION) {
				callback && callback(msg);
				return;
			}
		}
	})
}

/**
 * 开始ws的心跳轮训，如果如果
 */
function startWsHeartLoop(callback) {
	if (heartInterval) {
		return
	}
	consoleLog("开始ws的心跳轮训");
	heartInterval = setInterval(function () {
		consoleLog("发送心跳");
		// 只读属性 readyState 表示连接状态，可以是以下值：
		// 0 - 表示连接尚未建立。
		// 1 - 表示连接已建立，可以进行通信。
		// 2 - 表示连接正在进行关闭。
		// 3 - 表示连接已经关闭或者连接不能打开。
		if (!socket) {
			consoleLog("socket不存在");
			return
		}
		var status = socket.readyState;
		if (status == 1) {
			var heartBody = { "msgType": WS_MSG_TYPE_HEART_UP }
			socket.send(JSON.stringify(heartBody));
		} else if (status == 0 || status == 3) {
			setWsConnect(false)
			consoleLog("开始重新链接ws");
			wsConnect(callback)
		}
	}, 26 * 1000);
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

function showNotification(title, text, id) {
	var notification_audio = localStorage['notification_audio'] * 1;
	if (notification_audio !== 0) {
		playAudio('music/breeze.mp3');
	}
	chrome.notifications.create(id, {
		'type': 'basic',
		'title': title || 'WxPusher通知提醒',
		'message': text,
		'silent': true,
		'requireInteraction': true,
		'iconUrl': 'icon/128.png'
	});
}

function listenNotificationClicked() {
	consoleLog("开始监听通知点击事件")
	chrome.notifications.onClicked.addListener((id) => {
		consoleLog("点击通知，id=" + id)
		//点击了以后，关闭对应的通知
		chrome.notifications.clear(id)
		var url=id.startsWith("http")?id: 'https://wxpusher.zjiecode.com/api/message/' + id
		chrome.tabs.create({
			'url': url
		});
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
