initApp('', function(){
	var wxpusher_code = localStorage['wxpusher_code'] || '';
	var notification_audio = localStorage['notification_audio'] || '1';
	var notification_display = localStorage['notification_display'] || '1';
	document.getElementById("wxpusher_code").value = wxpusher_code;
	document.getElementById("notification_audio").value = notification_audio;
	document.getElementById("notification_display").value = notification_display;
	document.getElementById("save_options").onclick = save_options;
	showLog('欢迎使用WxPusher！');
	if(!wxpusher_code){
		document.getElementById('wxpusher_qrcode').style.display = 'inline';
		Ajax('GET', 'http://wxpusher.test.zjiecode.com/api/device/create-login-qrcode', '', {}, function(res){
			res = JSON.parse(res);
			if(res.data.code){
				document.getElementById('wxpusher_qrcode').src = 'http://wxpusher.test.zjiecode.com/api/qrcode/' + res.data.code + '.jpg';
				document.getElementById("wxpusher_code").value = res.data.code;
				showLog('微信扫码后点击保存');
			}
		});
	}
});

function save_options(){
	localStorage['wxpusher_code'] = document.getElementById("wxpusher_code").value;
	localStorage['notification_audio'] = document.getElementById("notification_audio").value;
	localStorage['notification_display'] = document.getElementById("notification_display").value;
	playAudio('music/open.mp3');
	showLog('保存成功！');
}