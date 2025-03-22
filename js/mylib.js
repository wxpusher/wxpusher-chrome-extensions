//ws服务器下发消息类型枚举
var WS_MSG_TYPE_HEART_UP = 101;//上行心跳响应
var WS_MSG_TYPE_HEART = 201;//下行心跳响应
var WS_MSG_TYPE_INIT = 202;//收到服务器下发初始化信息
var WS_MSG_TYPE_ERROR = 203;//错误提示
var WS_MSG_TYPE_UPDATE = 204;//升级提示
var WS_MSG_TYPE_UPSH_NOTIFICATION = 20001;//推送的通知消息
var HEART_TIME_SPACE = 26 * 1000;//心跳时间间隔

//发送心跳的任务
var heartInterval = undefined;
//ws长链接
var socket = undefined;
//上一次收到服务器消息
var lastServerHeart = 0;

//是否是打开扩展程序的页面
var inExtension = (typeof location !== 'undefined' && location.href && location.href.indexOf('chrome-extension://') === 0) ? true : false;

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
	// 创建请求头
	const headers = new Headers({
		'platform': getPlatform(),
		'version': getVersion(),
		'deviceToken': getDeviceToken(),
		'Content-Type': 'application/json;charset=UTF-8'
	});
	
	// 添加自定义请求头
	if (header) {
		for (var key in header) {
			headers.append(key, header[key]);
		}
	}
	
	// 创建请求配置
	const config = {
		method: method || 'GET',
		headers: headers,
		credentials: 'omit', // 相当于 xhr.withCredentials = false
		body: data ? JSON.stringify(data) : undefined
	};
	
	// 发送fetch请求
	fetch(url, config)
		.then(response => {
			// 获取响应状态和文本内容
			const status = response.status;
			return response.text().then(text => {
				return { status, text };
			});
		})
		.then(({ status, text }) => {
			// 回调处理响应
			callback && callback(status, text);
		})
		.catch(error => {
			// 错误处理
			errorCallback && errorCallback(error);
		});
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
			setWsConnect(true)
			var msg = JSON.parse(e.data);
			if (typeof msg !== 'object') {
				consoleLog('长链接消息内容错误');
				return;
			}
			if (msg.msgType == WS_MSG_TYPE_HEART) {
				consoleLog('收到心跳响应');
				lastServerHeart = Date.now();
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
				showNotification(msg.title, msg.content, Date.now()+"");
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
			setWsConnect(false)
			return
		}
		//+10秒延迟和通讯时间
		if (Date.now() - lastServerHeart > HEART_TIME_SPACE + 10 * 1000) {
			consoleLog("收到服务器心跳超时，标记为链接失败");
			setWsConnect(false)
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
	}, HEART_TIME_SPACE);
}

function consoleLog(str) {
	console.log('[' + getSysDateFormat() + ']：' + str);
}

/**
 * 检查并创建offscreen页面
 */
async function createOffscreenDocumentIfNeeded() {
	// 检查是否已经有offscreen页面
	const offscreenUrl = chrome.runtime.getURL('offscreen.html');
	const existingContexts = await chrome.runtime.getContexts({
		contextTypes: ['OFFSCREEN_DOCUMENT']
	});

	// 如果已经存在offscreen页面，不需要再创建
	if (existingContexts.some(c => c.documentUrl === offscreenUrl)) {
		return;
	}

	// 创建offscreen页面
	await chrome.offscreen.createDocument({
		url: offscreenUrl,
		reasons: ['AUDIO_PLAYBACK'],
		justification: '用于播放通知提示音'
	});
}

/**
 * 关闭offscreen页面
 */
async function closeOffscreenDocument() {
	try {
		await chrome.offscreen.closeDocument();
	} catch (e) {
		consoleLog('关闭offscreen页面失败: ' + e);
	}
}

/**
 * 播放通知声音
 */
async function playNotificationSound() {
	try {
		// 确保offscreen页面已创建
		await createOffscreenDocumentIfNeeded();
		
		// 发送消息到offscreen页面播放声音
		chrome.runtime.sendMessage({
			type: 'play-notification-sound'
		});
		
		// 5秒后自动关闭offscreen页面
		setTimeout(() => {
			closeOffscreenDocument();
		}, 5000);
	} catch (error) {
		consoleLog('播放通知声音失败: ' + error);
	}
}

function showNotification(title, text, id) {
	if (getNotificationAudio()) {
		// 使用offscreen API播放声音
		playNotificationSound();
	}
	chrome.notifications.create(id, {
		'type': 'basic',
		'title': title || 'WxPusher通知提醒',
		'message': text,
		'silent': true, // 设为静音，由我们自己控制声音
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
		var url = id.startsWith("http") ? id : 'https://wxpusher.zjiecode.com/api/message/' + id
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

// 将变量和函数导出到全局作用域
self.WS_MSG_TYPE_HEART_UP = WS_MSG_TYPE_HEART_UP;
self.WS_MSG_TYPE_HEART = WS_MSG_TYPE_HEART;
self.WS_MSG_TYPE_INIT = WS_MSG_TYPE_INIT;
self.WS_MSG_TYPE_ERROR = WS_MSG_TYPE_ERROR;
self.WS_MSG_TYPE_UPDATE = WS_MSG_TYPE_UPDATE;
self.WS_MSG_TYPE_UPSH_NOTIFICATION = WS_MSG_TYPE_UPSH_NOTIFICATION;
self.HEART_TIME_SPACE = HEART_TIME_SPACE;

self.sajax = sajax;
self.ajax = ajax;
self.wsConnect = wsConnect;
self.startWsHeartLoop = startWsHeartLoop;
self.consoleLog = consoleLog;
self.showNotification = showNotification;
self.listenNotificationClicked = listenNotificationClicked;
self.getSysTime = getSysTime;
self.getSysDateFormat = getSysDateFormat;
self.getSysDateFormat2 = getSysDateFormat2;
self.getSysDateFormat3 = getSysDateFormat3;
self.createOffscreenDocumentIfNeeded = createOffscreenDocumentIfNeeded;
self.closeOffscreenDocument = closeOffscreenDocument;
self.playNotificationSound = playNotificationSound;
