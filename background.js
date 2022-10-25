console_log('执行background.js！');

var WxPusher = null; // 用于发送消息
chrome.runtime.onInstalled.addListener((e) => {
	if(e.reason === chrome.runtime.OnInstalledReason.INSTALL){
		chrome.tabs.create({
			'url': 'popup.html'
		});
		localStorage['extension_installtime'] = getSysDateFormat();
		chrome.runtime.setUninstallURL('https://wxpusher.zjiecode.com/docs/#/');
	}
});
chrome.runtime.onStartup.addListener(() => {
	;
});
initApp('', function(){
	var loginInterval = setInterval(function(){
		if(localStorage['wxpusher_code']){
			clearInterval(loginInterval);
			WxPusher = initWxPusher(function(msg){
				if(msg.msgType === 20001){
					showNotification(msg.title || 'WxPusher', msg.content, msg.url || '');
				}
			}, 5000, 30000);
		}
	}, 200);
	notificationsOnClicked();
	console_log('background.js执行完毕！');
});


function initWxPusher(onmessage, hearttime, timeout){
	var ws = {};
	var socket = {};
	var sendmessagetime = 0;
	var onmessagetime = 0;
	var url_msg = 'ws://wxpusher.test.zjiecode.com:6104/ws';
	var url_reg = 'http://wxpusher.test.zjiecode.com/api/device/register-device';
	var version = chrome.runtime.getManifest().version;
	var platform = 'Chrome-';
	var deviceName = '';
	chrome.runtime.getPlatformInfo((info) => {
		if(info.os == 'win'){
			platform += 'Windows'
		}
		else if(info.os == 'mac'){
			platform += 'Mac'
		}
		else{
			platform += 'Other'
		}
		deviceName = platform + '_' + localStorage['extension_installtime'];
		url_msg += '?version=' + version + '&platform=' + platform + (localStorage['wxpusher_pushToken'] ? ('&pushToken=' + localStorage['wxpusher_pushToken']) : '');
		ws.init(); // 初始化
		if(hearttime > 0){
			console_log('webSocket开启心跳！');
			setInterval(function(){
				if(navigator.onLine){
					ws.send({'msgType': 101}); // 协议
				}
			}, hearttime);
		}
		setTimeout(function(){
			if(ws.getState() !== 201){
				showNotification('WxPusher', '登录失败！');
			}
		}, 10000);
	});
	ws.init = function(){
		ws.readyState = 100;
		socket = new WebSocket(url_msg);
		socket.onopen = function(e){
			console_log('webSocket连接成功！');
		};
		socket.onmessage = function(e){
			onmessagetime = getSysTime();
			var msg = JSON.parse(e.data);
			if(typeof msg === 'object'){
				if(msg.msgType == 201){
					console_log('收到心跳响应！');
				}
				else if(msg.msgType == 202){
					console_log('收到服务器下发初始化信息！');
					if(url_msg.indexOf('&pushToken=') < 0){
						localStorage['wxpusher_pushToken'] = msg.pushToken;
						url_msg += '&pushToken=' + msg.pushToken;
						ws.init();
					}
					else{
						Ajax('POST', url_reg, JSON.stringify({
							'code': localStorage['wxpusher_code'] || '',
							'deviceName': deviceName,
							'pushToken': msg.pushToken,
							'platform':  platform,
							'deviceUuid': localStorage['wxpusher_deviceUuid'] || ''
						}), {
							'platform':  platform,
							'version': version,
							'deviceToken': localStorage['deviceToken'] || ''
						}, function(res){
							res = JSON.parse(res);
							if((typeof res === 'object') && res.success){
								ws.readyState = 200;
								if(localStorage['wxpusher_deviceUuid'] !== res.data.deviceUuid){
									localStorage['wxpusher_deviceUuid'] = res.data.deviceUuid;
									showNotification('WxPusher', '登录成功！');
								}
								else{
									console_log('WxPusher登录成功！');
								}
							}
						});
					}
				}
				else if(msg.msgType == 204){
					showNotification(msg.title || 'WxPusher', msg.content, msg.url || '');
				}
				else{
					onmessage && onmessage(msg);
				}
			}
			else{
				console_log('webSocket解析data失败！');
			}
		};
	};
	ws.getState = function(){
		return (ws.readyState + socket.readyState);
	};
	ws.send = function(msg){
		if(ws.getState() !== 201){
			console_log('WxPusher未登录，状态码：' + ws.getState());
		}
		else if(typeof socket.readyState === 'undefined'){
			console_log('webSocket无效重连！');
			ws.init();
		}
		else if(socket.readyState === 1){
			socket.send(JSON.stringify(msg));
			sendmessagetime = getSysTime();
			if(timeout > 0){
				setTimeout(function(){
					if((sendmessagetime > onmessagetime) && (getSysTime() - onmessagetime > timeout)){
						console_log('webSocket超时重连！');
						ws.init();
					}
				}, timeout);
			}
		}
		else if(socket.readyState > 1){
			console_log('webSocket掉线重连！');
			ws.init();
		}
	};
	return ws;
}