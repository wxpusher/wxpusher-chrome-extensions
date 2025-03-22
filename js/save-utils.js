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
    if (v == undefined) {
        return true;
    }
    return v == true || v == "true"
}

// 在Service Worker中使用的存储函数，使用chrome.storage.local替代localStorage
if (typeof localStorage === 'undefined') {
    // 为Service Worker提供存储实现
    const storageData = {};
    let storageInitialized = false;
    const storageInitPromise = new Promise(resolve => {
        chrome.storage.local.get(null, (items) => {
            Object.assign(storageData, items);
            storageInitialized = true;
            resolve();
        });
    });

    // 监听storage变化，保持数据同步
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            for (const [key, { newValue }] of Object.entries(changes)) {
                storageData[key] = newValue;
            }
        }
    });

    // 模拟localStorage的设置和获取操作
    function chromeStorageSet(key, value) {
        storageData[key] = value;
        const obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj);
        return value;
    }

    function chromeStorageGet(key) {
        return storageData[key];
    }

    // 确保在使用前数据已经初始化
    function ensureStorageInitialized(fn) {
        return function(...args) {
            if (storageInitialized) {
                return fn(...args);
            }
            
            // 如果还没初始化完成，等待初始化
            console.warn('Storage not initialized yet, falling back to default value');
            return '';
        };
    }

    // 重新定义所有存储函数以使用chrome.storage
    self.setVersion = function(version) {
        return chromeStorageSet('version', version);
    };

    self.getVersion = ensureStorageInitialized(function() {
        return chromeStorageGet('version') || '';
    });

    self.setPlatform = function(platform) {
        return chromeStorageSet('platform', platform);
    };

    self.getPlatform = ensureStorageInitialized(function() {
        return chromeStorageGet('platform') || '';
    });

    self.isWsConnect = ensureStorageInitialized(function() {
        var v = chromeStorageGet('isWsConnect');
        if (v == undefined) {
            return true;
        }
        return v == true || v == "true";
    });

    self.setWsConnect = function(isWsConnect) {
        return chromeStorageSet('isWsConnect', isWsConnect);
    };

    self.getPushToken = ensureStorageInitialized(function() {
        return chromeStorageGet('pushToken') || '';
    });

    self.setPushToken = function(pushToken) {
        return chromeStorageSet('pushToken', pushToken);
    };

    self.setDeviceToken = function(deviceToken) {
        return chromeStorageSet('deviceToken', deviceToken);
    };

    self.getDeviceToken = ensureStorageInitialized(function() {
        return chromeStorageGet('deviceToken') || '';
    });

    self.setDeviceUuid = function(deviceUuid) {
        return chromeStorageSet('deviceUuid', deviceUuid);
    };

    self.getDeviceUuid = ensureStorageInitialized(function() {
        return chromeStorageGet('deviceUuid') || '';
    });

    self.setDeviceName = function(deviceName) {
        return chromeStorageSet('deviceName', deviceName);
    };

    self.getDeviceName = ensureStorageInitialized(function() {
        return chromeStorageGet('deviceName') || '';
    });

    self.setNotificationAudio = function(audio) {
        return chromeStorageSet('notificationAudio', audio);
    };

    self.getNotificationAudio = ensureStorageInitialized(function() {
        var v = chromeStorageGet('notificationAudio');
        if (v == undefined) {
            return true;
        }
        return v == true || v == "true";
    });
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

