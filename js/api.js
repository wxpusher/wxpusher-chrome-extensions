
var baseHost = "wxpusher.zjiecode.com"
var apiHost = "https://"+baseHost
var wsHost = "wss://"+baseHost

/**
 * resp通用处理器，拦截很多非业务事件
 */
function baseRespHanlder(bizCallBack, bizErrorCallback) {
    return function (code,res) {
        if(!res){
            return;
        }
        var rootBody = JSON.parse(res);
        if (rootBody.code === 1000) {
            bizCallBack && bizCallBack(rootBody.data);
            return;
        }
        bizErrorCallback && bizErrorCallback(rootBody.code, rootBody.msg, rootBody);
    }
}

/**
 * 创建登陆二维码
 */
function createLoginQrcode(callback, errorCallback) {
    sajax('GET', apiHost + '/api/device/create-login-qrcode', baseRespHanlder(callback), function (e) {
        errorCallback && errorCallback(e.error);
    });
}

/**
 * 拼接登陆二维码的地址url
 */
function getQrcodeUrl(code) {
    return apiHost + '/api/qrcode/' + code + '.jpg';
}

/**
 * 设备首次注册，没有deviceUuid，绑定设置deviceUuid和pushToken
 * 返回：
 * {deviceUuid,deviceToken}
 */
function bindPushToken(code, pushToken, deviceName, callback, errorCallback) {
    var data = {
        'code': code,
        'pushToken': pushToken,
        'deviceName': deviceName,
    };
    ajax('POST', apiHost + '/api/device/register-device', data, undefined, baseRespHanlder(callback), errorCallback);
}

/**
 * 已经注册设备，第二次打开的时候，更新pushToken的绑定关系
 * 返回：
 * {deviceUuid,deviceToken}
 */
function updatePushToken(pushToken, deviceUuid, callback, errorCallback) {
    var data = {
        'pushToken': pushToken,
        'deviceUuid': deviceUuid,
    };
    ajax('POST', apiHost + '/api/device/register-device', data, undefined, baseRespHanlder(callback), errorCallback);
}

/**
 * 检查软件更新
 * 返回
 * {
        "title":"升级提示",
        "content":"新的版本，请你升级",
        "version":"1.0.1",
        "must":false,//是否必须升级，true表示强制，不升级没法用
        "url":"http://m.baidu.com" //升级的链接
    }
 */
function checkUpdate(bizCallBack) {
    sajax('GET', apiHost + '/api/device/version-update', function (code,res) {
        var rootBody = JSON.parse(res);
        if (rootBody.code === 1007) {
            //需要进行升级
            bizCallBack && bizCallBack(true, rootBody.data);
            return;
        }
        bizCallBack && bizCallBack(false, rootBody.msg);
    }, function (e) {
        bizCallBack && bizCallBack(false, '检查升级失败');
    });
}