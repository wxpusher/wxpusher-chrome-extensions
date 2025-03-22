//内存存储一些数据，每次打开的时候，初始化
function setVersion(version) {
    localStorage['version'] = version;
}

function getVersion() {
    return localStorage['version'] || '';
}

function setPlatform(platform) {
    localStorage['platform'] = platform;
}

function getPlatform() {
    return localStorage['platform'] || '';
}

function isWsConnect() {
    var v = localStorage['isWsConnect'];
    if (!v) {
        return true;
    }
    return v == 'true'
}
function setWsConnect(isWsConnect) {
    return localStorage['isWsConnect'] = isWsConnect;
}

function getPushToken() {
    return localStorage['pushToken'] || '';
}

function setPushToken(pushToken) {
    localStorage['pushToken'] = pushToken;
}
function setDeviceToken(deviceToken) {
    localStorage['deviceToken'] = deviceToken;
}

function getDeviceToken() {
    return localStorage['deviceToken'] || '';
}
function setDeviceUuid(deviceUuid) {
    localStorage['deviceUuid'] = deviceUuid;
}

function getDeviceUuid() {
    return localStorage['deviceUuid'] || '';
}

function setDeviceName(deviceName) {
    localStorage['deviceName'] = deviceName;
}

function getDeviceName() {
    return localStorage['deviceName'] || '';
}

function setNotificationAudio(audio) {
    localStorage['notificationAudio'] = audio;
}

function getNotificationAudio() {
    var v = localStorage['notificationAudio'];
    if (!v) {
        return true;
    }
    return v == true || v == "true"
}

// 在Service Worker中使用的存储函数，使用chrome.storage.local替代localStorage
if (typeof localStorage === 'undefined') {
    // 为Service Worker提供存储实现
    const chromeStorageCache = {};

    // 模拟localStorage的设置和获取操作
    function chromeStorageSet(key, value) {
        chromeStorageCache[key] = value;
        const obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj);
        return value;
    }

    function chromeStorageGet(key) {
        return chromeStorageCache[key];
    }

    // 初始加载所有存储项到缓存
    chrome.storage.local.get(null, (items) => {
        Object.assign(chromeStorageCache, items);
    });

    // 重新定义所有存储函数以使用chrome.storage
    self.setVersion = function (version) {
        chromeStorageSet('version', version);
    };

    self.getVersion = function () {
        return chromeStorageGet('version') || '';
    };

    self.setPlatform = function (platform) {
        chromeStorageSet('platform', platform);
    };

    self.getPlatform = function () {
        return chromeStorageGet('platform') || '';
    };

    self.isWsConnect = function () {
        var v = chromeStorageGet('isWsConnect');
        if (!v) {
            return true;
        }
        return v == true || v == "true";
    };

    self.setWsConnect = function (isWsConnect) {
        return chromeStorageSet('isWsConnect', isWsConnect);
    };

    self.getPushToken = function () {
        return chromeStorageGet('pushToken') || '';
    };

    self.setPushToken = function (pushToken) {
        chromeStorageSet('pushToken', pushToken);
    };

    self.setDeviceToken = function (deviceToken) {
        chromeStorageSet('deviceToken', deviceToken);
    };

    self.getDeviceToken = function () {
        return chromeStorageGet('deviceToken') || '';
    };

    self.setDeviceUuid = function (deviceUuid) {
        chromeStorageSet('deviceUuid', deviceUuid);
    };

    self.getDeviceUuid = function () {
        return chromeStorageGet('deviceUuid') || '';
    };

    self.setDeviceName = function (deviceName) {
        chromeStorageSet('deviceName', deviceName);
    };

    self.getDeviceName = function () {
        return chromeStorageGet('deviceName') || '';
    };

    self.setNotificationAudio = function (audio) {
        chromeStorageSet('notificationAudio', audio);
    };

    self.getNotificationAudio = function () {
        var v = chromeStorageGet('notificationAudio');
        if (!v) {
            return true;
        }
        return v == true || v == "true";
    };
} else {
    // 在常规页面上下文中，导出到全局作用域
    self.setVersion = setVersion;
    self.getVersion = getVersion;
    self.setPlatform = setPlatform;
    self.getPlatform = getPlatform;
    self.isWsConnect = isWsConnect;
    self.setWsConnect = setWsConnect;
    self.getPushToken = getPushToken;
    self.setPushToken = setPushToken;
    self.setDeviceToken = setDeviceToken;
    self.getDeviceToken = getDeviceToken;
    self.setDeviceUuid = setDeviceUuid;
    self.getDeviceUuid = getDeviceUuid;
    self.setDeviceName = setDeviceName;
    self.getDeviceName = getDeviceName;
    self.setNotificationAudio = setNotificationAudio;
    self.getNotificationAudio = getNotificationAudio;
}

