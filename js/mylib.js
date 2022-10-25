var inExtension = (location.href.indexOf('chrome-extension://') === 0) ? true : false;
var inExtensionBackground = (typeof XMLHttpRequest === 'undefined') ? true : false;

function initApp(url, callback){
	console_log('执行initApp函数！');
	if(inExtension){
		playAudio('music/open.mp3');
	}
	console_log('initApp函数执行完毕！');
	callback && callback();
}

function console_log(str){
	console.log('[' + getSysDateFormat() + ']：' + str);
}

function showLog(str){
	str = '[' + getSysDateFormat3()+']：' + str;
	console.log(str);
	if((!inExtensionBackground) && document.getElementById("console_log")){
		document.getElementById("console_log").innerHTML = str;
	}
}

function playAudio(file_url){
	var bell_url = chrome.runtime.getURL(file_url);
	var audio = new Audio(bell_url);
	audio.loop = false;
	audio.play();
}

function showNotification(title, text, url){
	var notification_audio = localStorage['notification_audio']*1;
	var notification_display = localStorage['notification_display']*1;
	if(notification_audio !== 0){
		playAudio('music/breeze.mp3');
	}
	chrome.notifications.create({
		'type': 'basic',
		'title': title || '通知',
		'message': text,
		'silent': true,
		'requireInteraction': (notification_display !== 0) ? true : false,
		'iconUrl': 'icon/128.png'
	}, (id) => {
		if(url){
				var notification_arr = JSON.parse(localStorage['notification_arr'] || '[]');
				notification_arr.push(id + '|' + url);
				while(notification_arr.length > 100){
					notification_arr.splice(0, 1);
				}
				localStorage['notification_arr'] = JSON.stringify(notification_arr);
		}
	});
}

function notificationsOnClicked(){
	chrome.notifications.onClicked.addListener((id) => {
		var notification_arr = JSON.parse(localStorage['notification_arr'] || '[]');
		for(var i=0; i<notification_arr.length; i++){
			if(notification_arr[i].indexOf(id + '|') === 0){
				chrome.tabs.create({'url': (notification_arr[i].split('|'))[1]});
				notification_arr.splice(i, 1);
				break;
			}
		}
		localStorage['notification_arr'] = JSON.stringify(notification_arr);
	});
}
function Ajax(type, url, data, header, callback){
    var xhr = new XMLHttpRequest();
	header = extend({'Content-Type': (data.indexOf('{') === 0) ? 'application/json;charset=UTF-8' : 'application/x-www-form-urlencoded;charset=UTF-8'}, header);
	
    xhr.open((type || 'GET'), url, true);
	for(var key in header){
		xhr.setRequestHeader(key, header[key]);
	}
	xhr.withCredentials = true;
    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4){
			if(xhr.status == 200){
				callback && callback(xhr.responseText);
			}
        }
    }
	xhr.send(data);
}
function extend(json1, json2){
	if((json1.constructor == Object) && (json2.constructor == Object)){ // 对象
		for(var key in json2){
			json1[key] = json2[key];
		}
	}
	else if((json1.constructor == Array) && (json2.constructor == Array)){ // 数组
		for(var i=0; i<json2.length; i++){
			if(json1.indexOf(json2[i]) < 0){
				json1.push(json2[i]);
			}
		}
	}
	return json1;
}
Date.prototype.Format = function (fmt){
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": parseInt((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if(/(y+)/.test(fmt)){
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
    for(var k in o){
		if(new RegExp("(" + k + ")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
    }
	return fmt;
}
function getSysTime(){
	return Date.now();
}
function getSysDateFormat(){
	return (new Date()).Format("yyyy-MM-dd hh:mm:ss.S");
}
function getSysDateFormat2(){
	return (new Date()).Format("yyyy-MM-dd");
}
function getSysDateFormat3(){
	return (new Date()).Format("hh:mm:ss.S");
}
